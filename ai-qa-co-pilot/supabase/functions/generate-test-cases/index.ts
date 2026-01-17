import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceType, sourceUrl, projectName, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `You are an expert QA engineer and test case generator. Your role is to analyze applications, designs, or requirements and generate comprehensive, professional test cases.

Each test case MUST follow this exact JSON structure:
{
  "test_case_id": "TC-001",
  "title": "Clear, action-oriented title",
  "description": "Brief description of what is being tested",
  "preconditions": "Required setup or state before testing",
  "steps": [
    {"step": 1, "action": "Action to perform", "expected": "Expected result"},
    {"step": 2, "action": "Next action", "expected": "Expected result"}
  ],
  "expected_result": "Final expected outcome",
  "priority": "low|medium|high|critical",
  "test_type": "functional|regression|integration|performance|security|usability",
  "automation_feasibility": true|false,
  "tags": ["tag1", "tag2"]
}

Generate test cases that cover:
- Happy path scenarios
- Edge cases and boundary conditions
- Negative testing scenarios
- Error handling
- Input validation
- User experience flows

Always return a JSON object with a "test_cases" array containing 5-15 comprehensive test cases.`;

    let userPrompt = "";

    if (sourceType === "url") {
      userPrompt = `Analyze this web application URL and generate comprehensive test cases:
URL: ${sourceUrl}

Consider:
- All visible UI elements and interactions
- Form validations and submissions
- Navigation flows
- Responsive behavior
- Error states and edge cases
- User authentication if applicable
- Data CRUD operations`;
    } else if (sourceType === "figma") {
      userPrompt = `Analyze this Figma design URL and generate test cases based on the UI/UX design:
Figma URL: ${sourceUrl}

Consider:
- All UI components and their expected behavior
- User interaction flows
- State changes and transitions
- Form inputs and validations
- Navigation patterns
- Accessibility requirements`;
    } else if (sourceType === "description") {
      userPrompt = `Generate test cases for this application/feature:
Project: ${projectName}
Description: ${description}

Consider all functional and non-functional testing aspects.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_test_cases",
              description: "Generate structured test cases from the analysis",
              parameters: {
                type: "object",
                properties: {
                  test_cases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        test_case_id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        preconditions: { type: "string" },
                        steps: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              step: { type: "number" },
                              action: { type: "string" },
                              expected: { type: "string" }
                            },
                            required: ["step", "action", "expected"]
                          }
                        },
                        expected_result: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        test_type: { type: "string", enum: ["functional", "regression", "integration", "performance", "security", "usability"] },
                        automation_feasibility: { type: "boolean" },
                        tags: { type: "array", items: { type: "string" } }
                      },
                      required: ["test_case_id", "title", "steps", "expected_result", "priority", "test_type"]
                    }
                  }
                },
                required: ["test_cases"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_test_cases" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const testCases = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(testCases), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    throw new Error("Failed to generate test cases");
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});