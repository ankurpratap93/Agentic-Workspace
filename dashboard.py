import streamlit as st
import pandas as pd
import json
import os
import plotly.express as px
from datetime import datetime, date, time
import utils

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="CIO-Agent | Enterprise HR",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load Custom CSS
def local_css(file_name):
    with open(file_name) as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

if os.path.exists("styles.css"):
    local_css("styles.css")
else:
    st.warning("Styles not found. Run in proper directory.")

# --- SESSION STATE ---
if 'job_id' not in st.session_state:
    st.session_state['job_id'] = None

# --- SIDEBAR ---
st.sidebar.title("🤖 CIO-Agent")
st.sidebar.caption("Enterprise Hiring OS v3.0")
st.sidebar.markdown("---")

# Context Switcher
jobs = utils.get_all_jobs()
job_titles = [j['title'] for j in jobs]
job_map = {j['title']: j['id'] for j in jobs}

selected_job_title = st.sidebar.selectbox(
    "📂 Active Requisition",
    options=["Select Job..."] + job_titles,
    index=0
)

if selected_job_title != "Select Job...":
    st.session_state['job_id'] = job_map[selected_job_title]
    st.sidebar.success(f"Context: {selected_job_title}")
    
    # --- NAVIGATION STATE MANAGEMENT ---
    if 'page' not in st.session_state:
        st.session_state['page'] = 'Overview'
        
    def navigate_to(page):
        st.session_state['page'] = page
        st.rerun()

    # --- VISUAL PIPELINE STEPPER ---
    st.markdown("---")
    steps = ["Overview", "Candidates", "Phone Screening", "Scheduling", "Offer Centre"]
    
    # Render Custom HTML Stepper
    active_idx = steps.index(st.session_state['page']) if st.session_state['page'] in steps else 0
    
    stepper_html = '<div class="stepper-container">'
    for i, step in enumerate(steps):
        is_active = "active" if i <= active_idx else ""
        stepper_html += f"""<div class="step-item {is_active}"><div class="step-circle">{i+1}</div><div class="step-label">{step}</div><div class="step-line"></div></div>"""
    stepper_html += '</div>'
    st.markdown(stepper_html, unsafe_allow_html=True)

    # Sidebar Navigation (Fallback/shortcut)
    with st.sidebar:
        st.markdown("### 🧭 Quick Jump")
        for step in steps:
            if st.button(f"Go to {step}", key=f"nav_{step}", use_container_width=True):
                navigate_to(step)
        if st.button("📜 Logs", key="nav_logs"):
            navigate_to("Logs")

    nav = st.session_state['page']
else:
    st.session_state['job_id'] = None
    nav = "Home"

# --- HOME PAGE (Global) ---
if nav == "Home":
    st.markdown("# 🌍 HR Command Center")
    
    # Quick Stats
    c1, c2, c3 = st.columns(3)
    c1.metric("Active Jobs", len(jobs))
    c2.metric("Total Candidates", sum(j['candidate_count'] for j in jobs))
    c3.metric("Interviews Today", "0") # Mock
    
    st.markdown("### ⚡ Quick Actions")
    with st.expander("🚀 Initiate New Hiring Pipeline", expanded=True):
        with st.form("new_job"):
            col_a, col_b = st.columns(2)
            title = col_a.text_input("Job Title", placeholder="e.g. Staff Engineer")
            dept = col_b.text_input("Department", placeholder="Engineering")
            
            jd = st.text_area("Job Description (JD)", height=150, placeholder="Paste requirements here...")
            
            uploaded_resumes = st.file_uploader(
                "Upload Initial Batch of Resumes (PDF/TXT)", 
                accept_multiple_files=True,
                type=['pdf', 'txt']
            )
            
            submitted = st.form_submit_button("Create Pipeline & Ingest Resumes")
            
            if submitted and title:
                new_id = utils.create_new_job_with_resumes(title, jd, uploaded_resumes)
                st.toast(f"Pipeline Created: {new_id}!", icon="✅")
                st.session_state['job_id'] = new_id
                st.rerun()

    st.markdown("### 📂 Recent Requisitions")
    if not jobs:
        st.info("No active jobs. Start a new one above.")
    
    # Card Grid
    cols = st.columns(3)
    for idx, job in enumerate(jobs):
        with cols[idx % 3]:
            st.markdown(f"""
            <div class="glass-card">
                <h3>{job['title']}</h3>
                <p style="color:#aaa; font-size:0.8rem">ID: {job['id']}</p>
                <div style="display:flex; justify-content:space-between; margin-top:10px;">
                    <span class="badge badge-new">{job['candidate_count']} Candidates</span>
                    <span style="color:#666">{job['created_at']}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

# --- JOB CONTEXT PAGES ---
elif st.session_state['job_id']:
    job_id = st.session_state['job_id']
    
    # --- OVERVIEW ---
    # --- OVERVIEW ---
    if nav == "Overview":
        # Custom Header (Clean)
        st.markdown(f"""
        <div style="margin-bottom: 20px;">
            <h1 style="margin:0; font-size: 3rem; font-weight: 700; background: linear-gradient(to right, #60a5fa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);">{selected_job_title}</h1>
            <p>Requisition Dashboard</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Load Data
        df = utils.load_job_artifact(job_id, "cv_scores.csv")
        
        total = len(df) if df is not None else 0
        screened = len(df[df['score'] > 0]) if df is not None else 0
        interviewing = len(df[df['status'].str.contains('Interview', na=False)]) if df is not None else 0
        offers = len(df[df['status'].str.contains('Offer', na=False)]) if df is not None else 0
        
        # Custom Metrics Grid (Clean)
        st.markdown(f"""
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
            <div class="feature-card">
                <h3>Total Processed</h3>
                <p>{total}</p>
            </div>
            <div class="feature-card">
                <h3>Screened</h3>
                <p>{screened}</p>
            </div>
            <div class="feature-card">
                <h3>Interviewing</h3>
                <p>{interviewing}</p>
            </div>
            <div class="feature-card">
                <h3>Offers Pending</h3>
                <p>{offers}</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if df is not None and not df.empty:
            # Wrap Funnel in Card
            st.markdown('<div class="feature-card">', unsafe_allow_html=True)
            st.subheader("Hiring Funnel")
            state_counts = df['status'].value_counts().reset_index()
            state_counts.columns = ['Stage', 'Count']
            
            # Simple Clean Colors (Lovable Palette)
            color_map = {
                "New": "#3b82f6",         # Blue
                "Screened": "#8b5cf6",    # Purple
                "Shortlisted": "#10b981", # Emerald
                "Screening": "#10b981",
                "AI Screened": "#10b981",
                "Interview Ready": "#f59e0b", # Amber
                "Interview Scheduled": "#f59e0b",
                "Offer Pending": "#ec4899",       # Pink
                "Offer Accepted": "#ec4899",
                "Rejected": "#ef4444"     # Red
            }
            
            fig = px.funnel(
                state_counts, 
                x='Count', 
                y='Stage', 
                color='Stage',
                color_discrete_map=color_map
            )
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e2e8f0",
                showlegend=False,
                margin=dict(t=10, l=10, r=10, b=10)
            )
            st.plotly_chart(fig, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

        st.markdown("### 📝 Job Criteria")
        with st.expander("View / Edit Job Description", expanded=False):
            current_jd = utils.load_job_artifact(job_id, "jd.txt") or ""
            new_jd = st.text_area("Requirements", value=current_jd, height=300)
            if st.button("Update Criteria"):
                utils.save_job_artifact(job_id, "jd.txt", new_jd)
                st.success("Job Description Updated! Go to 'Candidates' -> 'Score New' to re-evaluate.")
                st.rerun()

    # --- CANDIDATES ---
    elif nav == "Candidates":
        st.title("👥 Candidate Pipeline")
        
        # --- Toolbar ---
        c_tool_1, c_tool_2, c_tool_3 = st.columns([2, 1, 1])
        with c_tool_1:
            search_query = st.text_input("🔍 Search Candidate", placeholder="Name or skill...")
        with c_tool_2:
            status_filter = st.multiselect("Filter Status", ["New", "Screened", "Shortlisted", "Interview Scheduled", "Offer Pending", "Rejected", "Error"])
        with c_tool_3:
            st.write("") # Spacer
            if st.button("🤖 Auto-Score All"):
                utils.trigger_simulation_step(job_id, "score_cvs")
                st.success("Analysis Complete")
                st.rerun()

        # --- Data Loading ---
        df = utils.load_job_artifact(job_id, "cv_scores.csv")
        
        if df is not None and not df.empty:
            # Filtering
            if status_filter:
                df = df[df['status'].isin(status_filter)]
            if search_query:
                df = df[df['name'].str.contains(search_query, case=False, na=False)]
            
            # --- SPLIT LAYOUT ---
            # Main Table (Left)
            c_table, c_details = st.columns([2, 1])
            
            with c_table:
                st.markdown("### 📋 Candidates")
                df_with_selections = df.copy()
                df_with_selections.insert(0, "Select", False)
                
                edited_df = st.data_editor(
                    df_with_selections, 
                    hide_index=True,
                    column_config={
                        "Select": st.column_config.CheckboxColumn(required=True),
                        "score": st.column_config.ProgressColumn("Fit Score", min_value=0, max_value=10, format="%.1f"),
                        "status": st.column_config.SelectboxColumn("Status", width="medium", options=["New", "Screened", "Shortlisted", "Interview Scheduled", "Offer Pending", "Rejected"]),
                        "name": st.column_config.TextColumn("Candidate Name", width="large"),
                        "id": None
                    },
                    use_container_width=True,
                    height=600
                )
            
            # Action/Details Pane (Right)
            with c_details:
                selected_rows = edited_df[edited_df.Select]
                count = len(selected_rows)
                
                if count > 0:
                    st.markdown(f"### ⚡ Actions ({count})")
                    
                    # BULK ACTIONS
                    if count > 1:
                        st.info(f"{count} candidates selected.")
                        st.markdown("#### Bulk Update")
                        b1, b2 = st.columns(2)
                        if b1.button("✅ Shortlist All"):
                            for _, row in selected_rows.iterrows():
                                if row['status'] not in ["Shortlisted", "Interview Scheduled", "Offer Pending"]:
                                    utils.update_candidate_status(job_id, row['name'], "Shortlisted")
                            st.toast(f"Updated valid candidates to Shortlisted!")
                            st.rerun()
                            
                        if b2.button("❌ Reject All"):
                            for _, row in selected_rows.iterrows():
                                if row['status'] != "Rejected":
                                    utils.update_candidate_status(job_id, row['name'], "Rejected")
                            st.toast(f"Rejected selection.")
                            st.rerun()
                        st.divider()

                    # SINGLE DETAIL VIEW (First Selection)
                    head = selected_rows.iloc[0]
                    cand_name = head['name']
                    cand_status = head['status']
                    cand_score = head['score']
                    
                    # Status Badge Logic
                    badge_class = "badge-new"
                    if "Interview" in cand_status: badge_class = "badge-interview"
                    elif "Offer" in cand_status: badge_class = "badge-offer"
                    elif "Reject" in cand_status: badge_class = "badge-rejected"
                    
                    st.markdown(f"""
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border-left:4px solid #6366f1;">
                        <h2 style="margin:0; font-size:1.8rem;">{cand_name}</h2>
                        <div style="margin-top:8px;">
                            <span class="badge {badge_class}">{cand_status}</span>
                            <span style="font-weight:bold; margin-left:10px; color:#ddd;">Fit Score: {cand_score}/10</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    st.write("") # Spacer
                    
                    # HIGHLIGHTS TAB
                    tab_summary, tab_resume = st.tabs(["✨ Highlights", "📄 Resume"])
                    
                    with tab_summary:
                        st.markdown("**Matched Keywords:**")
                        resume_path = utils.get_resume_path(job_id, cand_name)
                        if resume_path:
                            try:
                                cv_text = utils.extract_text(resume_path)
                                jd_text = utils.load_job_artifact(job_id, "jd.txt") or ""
                                matches = utils.get_matching_keywords(cv_text, jd_text)
                                
                                if matches:
                                    # Vibrant Tags
                                    html_tags = "".join([f"<span class='badge' style='background:linear-gradient(90deg, #4338ca 0%, #6366f1 100%); color:white; margin:3px; padding:5px 10px; border-radius:15px;'>{m}</span> " for m in matches[:15]])
                                    if len(matches) > 15: html_tags += f"... (+{len(matches)-15})"
                                    st.markdown(html_tags, unsafe_allow_html=True)
                                else:
                                    st.warning("No specific keyword matches found.")
                            except:
                                st.error("Error generating highlights.")
                        else:
                            st.warning("Resume file missing.")
                            
                        st.markdown("---")
                        
                        # LOGIC: Hide buttons if action already taken
                        st.markdown("#### Decisions")
                        c1, c2 = st.columns(2)
                        
                        # Shortlist Button
                        if cand_status in ["New", "Screened", "Screening", "Rejected"]:
                            label = "✅ Shortlist"
                            if cand_status == "Rejected":
                                label = "↩️ Restore to Shortlist"
                                
                            if c1.button(label, key="btn_sl_1"):
                                utils.update_candidate_status(job_id, cand_name, "Shortlisted")
                                st.rerun()
                        else:
                            c1.info(f"Already {cand_status}")

                        # Reject Button
                        # Reject Button
                        if cand_status != "Rejected":
                            if c2.button("❌ Reject", key="btn_rj_1"):
                                utils.update_candidate_status(job_id, cand_name, "Rejected")
                                st.rerun()
                        
                        if cand_status == "Shortlisted":
                            st.divider()
                            st.success("Candidate Shortlisted!")
                            if st.button("➡️ Proceed to Phone Screening", key=f"nav_to_screen_{cand_name}", type="primary"):
                                navigate_to("Phone Screening")

                    with tab_resume:
                        if resume_path:
                             # Read file once
                             with open(resume_path, "rb") as f:
                                 file_data = f.read()
                                 
                             # 1. Download Button
                             st.download_button(
                                 label="⬇️ Download Resume", 
                                 data=file_data, 
                                 file_name=os.path.basename(resume_path),
                                 mime="application/pdf"
                             )
                             
                             # 2. PDF Preview (Iframe)
                             if resume_path.endswith(".pdf"):
                                 import base64
                                 base64_pdf = base64.b64encode(file_data).decode('utf-8')
                                 pdf_display = f'<iframe src="data:application/pdf;base64,{base64_pdf}" width="100%" height="600" style="border:none; border-radius:10px;"></iframe>'
                                 st.markdown("### 📄 Preview")
                                 st.markdown(pdf_display, unsafe_allow_html=True)
                             else:
                                 st.info("Preview available for PDF files only.")
                                 st.code(file_data.decode('utf-8', errors='ignore'), language='text')

                        else:
                            st.info("No resume file found for this candidate.")

                else:
                    st.info("Select a candidate to view highlights & actions.")
                    st.markdown("""
                    <div style='text-align: center; color: #888; margin-top: 50px;'>
                        <p>👈 Select from the left</p>
                    </div>
                    """, unsafe_allow_html=True)
        else:
            st.info("No candidates found.")

        # Upload Area at bottom
        with st.expander("📤 Upload New Resumes"):
             new_files = st.file_uploader("Add files", accept_multiple_files=True)
             if st.button("Ingest"):
                if new_files:
                    count = utils.ingest_resumes(job_id, new_files)
                    st.success(f"Successfully ingested {count} resumes!")
                    st.rerun()

    # --- PHONE SCREENING (NEW) ---
    elif nav == "Phone Screening":
        st.title("📞 AI Phone Screening")
        st.caption("Auto-conduct interviews to specifically verify constraints.")
        
        df = utils.load_job_artifact(job_id, "cv_scores.csv")
        
        # Two Lists: Pending Screen (Shortlisted) vs Completed Screen (AI Screened)
        tab_pending, tab_review = st.tabs(["⏳ Pending Call", "✅ Review Transcripts"])
        
        with tab_pending:
            if df is not None:
                pending_df = df[df['status'] == 'Shortlisted']
                if not pending_df.empty:
                    st.markdown(f"### Ready for Screening ({len(pending_df)})")
                    
                    for idx, row in pending_df.iterrows():
                        cand = row['name']
                        with st.container():
                            st.markdown(f"""
                            <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <h3 style="margin:0">{cand}</h3>
                                    <p style="margin:0; color:#aaa">Resume Score: {row['score']}</p>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            if st.button(f"📞 Call {cand}", key=f"call_{cand}"):
                                with st.spinner(f"Agent calling {cand}..."):
                                    transcript, score = utils.conduct_agent_call(job_id, cand)
                                    st.success(f"Call Complete! Screening Score: {score}/10")
                                    st.rerun()
                else:
                    st.info("No candidates pending screening (mark them as 'Shortlisted' first).")
        
        with tab_review:
            if df is not None:
                screened_df = df[df['status'] == 'AI Screened']
                if not screened_df.empty:
                    for idx, row in screened_df.iterrows():
                        cand = row['name']
                        sc_score = row.get('screening_score', 0)
                        
                        c1, c2 = st.columns([3, 1])
                        with c1:
                            st.markdown(f"### {cand}")
                            st.caption(f"Screening Score: **{sc_score}/10**")
                            
                            transcript_file = f"call_log_{cand.replace(' ', '_')}.txt"
                            log_content = utils.load_job_artifact(job_id, transcript_file)
                            with st.expander("📄 Read Transcript"):
                                st.code(log_content)
                                
                        with c2:
                            st.markdown("#### Decision")
                            
                            # ACTION: Schedule Round 1 Directly
                            with st.form(key=f"form_r1_{cand}"):
                                st.markdown("##### 📅 Schedule Round 1")
                                d_input = st.date_input("Date", min_value=datetime.today())
                                t_input = st.time_input("Time", value=time(10, 0))
                                int_input = st.text_input("Interviewer (L1)", value="Senior Engineer")
                                
                                submitted = st.form_submit_button("✅ Approve & Schedule")
                                
                                if submitted:
                                    utils.schedule_interview(job_id, cand, d_input, t_input, int_input)
                                    st.toast(f"Invites sent to {cand} & {int_input}!", icon="📨")
                                    st.success("Round 1 Scheduled successfully!")
                                    # Direct Navigation
                                    navigate_to("Scheduling")
                            
                            if st.button("❌ Fail Screening", key=f"rej_{cand}"):
                                utils.update_candidate_status(job_id, cand, "Rejected")
                                st.rerun()
                else:
                    st.info("No completed screens to review.")

    # --- SCHEDULING ---
    elif nav == "Scheduling":
        st.title("🗓️ Interview Scheduler")
        
        c1, c2 = st.columns([1, 2])
        
        # Determine who needs scheduling (Status = Interview Ready)
        df = utils.load_job_artifact(job_id, "cv_scores.csv")
        pending_candidates = []
        if df is not None:
            # ONLY show candidates who passed AI Screen (Interview Ready) or manually scheduled
            pending_candidates = df[df['status'].isin(['Interview Ready', 'Interview Scheduled'])]['name'].tolist()
            
        with c1:
            st.markdown("### 📥 Schedule New")
            if pending_candidates:
                with st.form("schedule_form"):
                    cand = st.selectbox("Select Candidate", pending_candidates)
                    dt = st.date_input("Date", min_value=datetime.today())
                    tm = st.time_input("Time", value=time(10, 0))
                    interviewer = st.text_input("Interviewer ID", value="int_001")
                    
                    submitted = st.form_submit_button("Confirm Slot")
                    if submitted and cand:
                        utils.schedule_interview(job_id, cand, dt, tm, interviewer)
                        st.success(f"Scheduled {cand}!")
                        st.rerun()
            else:
                 st.info("No candidates ready for scheduling (Complete AI Screen first).")

        with c2:
            st.markdown("### 📅 Upcoming Interviews")
            sched = utils.load_job_artifact(job_id, "schedule_payload.json")
            if sched:
                # Convert list of dicts to readable format
                 for evt in sched: # type: ignore
                    st.markdown(f"""
                    <div class="glass-card" style="border-left: 5px solid #fbbf24;">
                        <h4>{evt.get('candidate', 'Unknown')}</h4>
                        <p>📅 {evt.get('date')} at {evt.get('time')}</p>
                        <p>👤 Interviewer: {evt.get('interviewer')}</p>
                        <span class="badge badge-interview">{evt.get('status')}</span>
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.info("No interviews scheduled.")

    # --- OFFER CENTRE ---
    elif nav == "Offer Centre":
        st.title("💼 Offer Management")
        
        tab1, tab2 = st.tabs(["Draft Offer", "Approvals"])
        
        with tab1:
            st.subheader("Draft New Offer")
            # Get candidates in 'Interview' stage who passed
            # Simplified: Just picking from list
            df = utils.load_job_artifact(job_id, "cv_scores.csv")
            candidates = df['name'].tolist() if df is not None else []
            
            c_sel = st.selectbox("Candidate", candidates)
            salary = st.number_input("Base Salary ($)", value=120000, step=5000)
            
            if st.button("Generate Offer Letter"):
                utils.generate_offer(job_id, c_sel, f"{salary:,}")
                st.success("Offer Generated!")
                st.rerun()
                
        with tab2:
            st.subheader("Awaiting Approval")
            payload = utils.load_job_artifact(job_id, "offer_payload.json")
            
            if payload:
                st.info(f"Candidate: **{payload.get('candidate')}**")
                st.info(f"Salary: **{payload.get('salary')}**")
                status = payload.get('status', 'Unknown')
                
                if status == "PENDING_APPROVAL":
                    if st.button("✅ Approve & Release"):
                        utils.approve_offer(job_id, payload.get('candidate'))
                        st.balloons()
                        st.rerun()
                elif status == "APPROVED":
                    st.success(f"Approved on {payload.get('approved_at')}")
                    st.download_button("Download Letter", data=utils.load_job_artifact(job_id, "offer_letter.txt") or "", file_name="offer.txt")

    # --- LOGS ---
    elif nav == "Logs":
        st.title("📜 Audit Log")
        logs = utils.load_job_artifact(job_id, "activity_log.json")
        if logs:
            st.table(pd.DataFrame(logs)[['timestamp', 'event', 'details']])

else:
    # Fallback if somehow state is inconsistent
    st.info("Select a job from the sidebar.")
