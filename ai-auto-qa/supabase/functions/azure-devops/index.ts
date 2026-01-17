import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, ...payload } = await req.json();

    // Get user's Azure connection
    const { data: connection } = await supabase
      .from("azure_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!connection && action !== "connect") {
      return new Response(JSON.stringify({ error: "No Azure DevOps connection found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const azureHeaders: Record<string, string> = connection ? {
      "Authorization": `Basic ${btoa(`:${connection.pat_token_encrypted}`)}`,
      "Content-Type": "application/json",
    } : {};

    switch (action) {
      case "connect": {
        const { organizationUrl, projectName, patToken } = payload;
        
        // Test the connection
        const testUrl = `${organizationUrl}/${projectName}/_apis/projects?api-version=7.0`;
        const testResponse = await fetch(testUrl, {
          headers: {
            "Authorization": `Basic ${btoa(`:${patToken}`)}`,
          },
        });

        if (!testResponse.ok) {
          throw new Error("Failed to connect to Azure DevOps. Please check your credentials.");
        }

        // Save connection
        const { error: saveError } = await supabase
          .from("azure_connections")
          .upsert({
            user_id: user.id,
            organization_url: organizationUrl,
            project_name: projectName,
            pat_token_encrypted: patToken, // In production, encrypt this
            is_active: true,
          }, { onConflict: "user_id" });

        if (saveError) throw saveError;

        return new Response(JSON.stringify({ success: true, message: "Connected successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-bugs": {
        const wiql = {
          query: `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [Microsoft.VSTS.Common.Priority], [Microsoft.VSTS.Common.Severity] 
                  FROM WorkItems 
                  WHERE [System.WorkItemType] = 'Bug' 
                  AND [System.TeamProject] = '${connection.project_name}'
                  ORDER BY [System.CreatedDate] DESC`
        };

        const queryUrl = `${connection.organization_url}/_apis/wit/wiql?api-version=7.0`;
        const queryResponse = await fetch(queryUrl, {
          method: "POST",
          headers: azureHeaders,
          body: JSON.stringify(wiql),
        });

        if (!queryResponse.ok) {
          const error = await queryResponse.text();
          throw new Error(`Failed to fetch bugs: ${error}`);
        }

        const queryResult = await queryResponse.json();
        const workItemIds = queryResult.workItems?.slice(0, 50).map((wi: any) => wi.id) || [];

        if (workItemIds.length === 0) {
          return new Response(JSON.stringify({ bugs: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get work item details
        const detailsUrl = `${connection.organization_url}/_apis/wit/workitems?ids=${workItemIds.join(",")}&api-version=7.0`;
        const detailsResponse = await fetch(detailsUrl, { headers: azureHeaders });
        const details = await detailsResponse.json();

        const bugs = details.value?.map((wi: any) => ({
          azureId: wi.id,
          title: wi.fields["System.Title"],
          state: wi.fields["System.State"],
          priority: wi.fields["Microsoft.VSTS.Common.Priority"] || 2,
          severity: wi.fields["Microsoft.VSTS.Common.Severity"] || "3 - Medium",
          assignedTo: wi.fields["System.AssignedTo"]?.displayName || null,
          description: wi.fields["System.Description"] || "",
          stepsToReproduce: wi.fields["Microsoft.VSTS.TCM.ReproSteps"] || "",
        })) || [];

        return new Response(JSON.stringify({ bugs }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create-bug": {
        const { title, description, stepsToReproduce, priority, severity, assignedTo } = payload;

        const patchDocument = [
          { op: "add", path: "/fields/System.Title", value: title },
          { op: "add", path: "/fields/System.Description", value: description || "" },
          { op: "add", path: "/fields/Microsoft.VSTS.TCM.ReproSteps", value: stepsToReproduce || "" },
          { op: "add", path: "/fields/Microsoft.VSTS.Common.Priority", value: priority || 2 },
        ];

        if (severity) {
          patchDocument.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Severity", value: severity });
        }
        if (assignedTo) {
          patchDocument.push({ op: "add", path: "/fields/System.AssignedTo", value: assignedTo });
        }

        const createUrl = `${connection.organization_url}/${connection.project_name}/_apis/wit/workitems/$Bug?api-version=7.0`;
        const createResponse = await fetch(createUrl, {
          method: "POST",
          headers: {
            ...azureHeaders,
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify(patchDocument),
        });

        if (!createResponse.ok) {
          const error = await createResponse.text();
          throw new Error(`Failed to create bug: ${error}`);
        }

        const createdBug = await createResponse.json();

        // Update last sync time
        await supabase
          .from("azure_connections")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", connection.id);

        return new Response(JSON.stringify({ 
          success: true, 
          azureWorkItemId: createdBug.id,
          url: createdBug._links?.html?.href 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sync-bug": {
        const { bugId, azureWorkItemId, updates } = payload;

        const patchDocument = Object.entries(updates).map(([field, value]) => ({
          op: "replace",
          path: `/fields/${field}`,
          value,
        }));

        const updateUrl = `${connection.organization_url}/_apis/wit/workitems/${azureWorkItemId}?api-version=7.0`;
        const updateResponse = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            ...azureHeaders,
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify(patchDocument),
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          throw new Error(`Failed to update bug: ${error}`);
        }

        // Update sync status in database
        if (bugId) {
          await supabase
            .from("bugs")
            .update({ sync_status: "synced", last_synced_at: new Date().toISOString() })
            .eq("id", bugId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "disconnect": {
        await supabase
          .from("azure_connections")
          .update({ is_active: false })
          .eq("user_id", user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});