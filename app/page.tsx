"use client";

import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";

type Skill = { name: string; evidence?: string };
type Analysis = {
  score: number;
  summary: string;
  matchedSkills: Skill[];
  partialSkills: Skill[];
  missingSkills: Skill[];
  keywords: { name: string; status: "found" | "partial" | "missing" }[];
  suggestions: { title: string; detail: string }[];
  requirements: string[];
  demo?: boolean;
};

const sampleAnalysis: Analysis = {
  score: 78,
  summary: "Your resume looks relevant to this role. A few requirements need stronger evidence, especially testing and deployment.",
  matchedSkills: ["React", "JavaScript", "Next.js", "TypeScript", "HTML", "CSS", "Git", "REST APIs"].map(name => ({ name })),
  partialSkills: [{ name: "Node.js", evidence: "Add a concrete backend project example" }, { name: "AWS", evidence: "Deployment experience is not clear" }, { name: "Docker", evidence: "Mention containerization if applicable" }],
  missingSkills: [{ name: "Testing", evidence: "Jest or React Testing Library" }, { name: "CI/CD", evidence: "GitHub Actions or similar" }, { name: "System design", evidence: "Architecture and trade-offs" }],
  keywords: ["frontend", "react", "next.js", "javascript", "typescript", "redux", "rest api", "tailwind css", "testing", "docker", "aws", "agile"].map((name, i) => ({ name, status: ([8, 9, 10].includes(i) ? "missing" : [5, 11].includes(i) ? "partial" : "found") as "found" | "partial" | "missing" })),
  suggestions: [
    { title: "Show testing experience", detail: "If accurate, add a bullet describing tests written with Jest or React Testing Library and what they cover." },
    { title: "Make backend contributions specific", detail: "Describe the Node.js/Express APIs you built, data flow, validation and error handling." },
    { title: "Add measurable impact", detail: "Include verified results such as reduced load time, fewer errors or improved task completion." },
  ],
  requirements: ["React and modern JavaScript", "TypeScript", "REST API integration", "Testing and maintainable code", "Deployment / CI-CD"],
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    bookmark: <><path d="M6 4h12v17l-6-4-6 4V4Z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1.9-1.5 2.6-1.4-.5a7.8 7.8 0 0 1-1.7 1l-.3 1.5h-3l-.3-1.5a7.8 7.8 0 0 1-1.7-1l-1.4.5-1.5-2.6 1.1-.9a7 7 0 0 1 0-2l-1.1-.9 1.5-2.6 1.4.5a7.8 7.8 0 0 1 1.7-1L12.7 7h3l.3 1.5a7.8 7.8 0 0 1 1.7 1l1.4-.5 1.5 2.6-1.1.9a7 7 0 0 1-.1 2Z" transform="translate(-1 -1)"/></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5"/><path d="M4 16v4h16v-4"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4m0 3h.01"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M4 17v4h16v-4"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return <svg {...common} aria-hidden="true">{paths[name] ?? paths.spark}</svg>;
}

export default function Home() {
  const [jobMode, setJobMode] = useState<"url" | "paste">("url");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activeTab, setActiveTab] = useState("Analysis");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const scoreColor = useMemo(() => (analysis?.score ?? 0) >= 75 ? "#16a56a" : (analysis?.score ?? 0) >= 50 ? "#d99118" : "#e34b55", [analysis?.score]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setError("Please choose a PDF or DOCX resume.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Your resume must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError("");
    setResume(file);
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!resume) { setError("Upload your resume first."); return; }
    if (jobMode === "url" && !jobUrl.trim() && !jobDescription.trim()) { setError("Enter a job URL or switch to paste the job description."); return; }
    if (jobMode === "paste" && !jobDescription.trim()) { setError("Paste the job description to continue."); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("resume", resume);
      if (jobUrl.trim()) form.append("jobUrl", jobUrl.trim());
      if (jobDescription.trim()) form.append("jobDescription", jobDescription.trim());
      const response = await fetch(`${apiBase}/api/analyze`, { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analysis failed. Please try again.");
      setAnalysis(payload.analysis as Analysis);
      setActiveTab("Analysis");
      document.getElementById("analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the backend. Check that Express is running on port 5000.");
    } finally { setLoading(false); }
  }

  function loadDemo() {
    setAnalysis({ ...sampleAnalysis, demo: true });
    setActiveTab("Analysis");
    document.getElementById("analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const result = analysis;
  const visibleKeywords = showAllKeywords ? result?.keywords ?? [] : (result?.keywords ?? []).slice(0, 12);

  return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Icon name="spark" size={20}/></span><span>AI<span className="brand-light">Analyzer</span></span></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#analyze" onClick={() => setMobileMenu(false)}><Icon name="home"/>Analyze Resume</a>
          <a className="nav-item" href="#analysis-results" onClick={() => {setActiveTab("Analysis");setMobileMenu(false)}}><Icon name="clock"/>History</a>
          <a className="nav-item" href="#analysis-results" onClick={() => setMobileMenu(false)}><Icon name="bookmark"/>Saved Jobs</a>
          <a className="nav-item" href="#settings" onClick={() => setMobileMenu(false)}><Icon name="settings"/>Settings</a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="plan-card"><div className="plan-title"><span className="crown">✦</span> Free plan</div><p>Build your next career move.</p><div className="plan-progress"><span /></div><div className="plan-caption">Demo mode · no account required</div><button className="plan-button" onClick={() => document.getElementById("analyze")?.scrollIntoView({behavior:"smooth"})}>Analyze a resume</button></div>
        <div className="sidebar-foot"><span className="avatar">A</span><span className="user-info"><b>Guest user</b><small>Personal workspace</small></span><span className="dots">···</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="mobile-menu-button icon-button" aria-label="Open navigation" onClick={() => setMobileMenu(true)}><Icon name="menu" size={21}/></button><div className="breadcrumb">Workspace <span>/</span> <b>Analyze Resume</b></div><div className="top-actions"><span className="status-dot"/> <span className="api-status">AI workspace</span><button className="help-button" onClick={() => alert("Upload a PDF/DOCX resume, add a job URL or paste a job description, then run the analysis.")}>? <span>Help</span></button><span className="avatar top-avatar">A</span></div></header>
        <div className="page-content">
          <section className="welcome-row"><div><div className="eyebrow"><Icon name="spark" size={14}/> CAREER TOOLKIT</div><h1>AI Job Match <span>&amp;</span> Resume Analyzer</h1><p>See how your resume aligns with a role. Find skill gaps, keywords, and clear next steps to strengthen your application.</p></div><div className="hero-art" aria-hidden="true"><div className="hero-sheet"><div className="sheet-top"/><div className="sheet-line long"/><div className="sheet-line"/><div className="sheet-line short"/><div className="sheet-check"><Icon name="check" size={22}/></div></div><div className="hero-bubble">✦ AI powered</div></div></section>

          <form id="analyze" className="input-grid" onSubmit={handleAnalyze}>
            <section className="panel job-panel"><div className="panel-heading"><span className="heading-icon"><Icon name="link" size={18}/></span><div><h2>Job description</h2><p>Where would you like to work?</p></div><span className="step-number">01</span></div>
              <div className="segmented"><button type="button" className={jobMode === "url" ? "selected" : ""} onClick={() => setJobMode("url")}><Icon name="link" size={15}/> Job URL</button><button type="button" className={jobMode === "paste" ? "selected" : ""} onClick={() => setJobMode("paste")}><Icon name="file" size={15}/> Paste description</button></div>
              {jobMode === "url" && <label className="field-label" htmlFor="job-url">Job posting link</label>}
              {jobMode === "url" && <input id="job-url" className="text-input" type="url" placeholder="https://company.com/jobs/frontend-developer" value={jobUrl} onChange={e => setJobUrl(e.target.value)}/>}
              <div className="or-divider"><span>{jobMode === "url" ? "OR PASTE THE DESCRIPTION BELOW" : "JOB DESCRIPTION"}</span></div>
              <label className="field-label" htmlFor="job-description">{jobMode === "url" ? "Job description (optional fallback)" : "Paste the full job description"}</label>
              <textarea id="job-description" className="text-area" placeholder="Paste responsibilities, qualifications, and skills from the job listing..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} maxLength={20000}/><div className="field-meta"><span>Include requirements for better results</span><span>{jobDescription.length.toLocaleString()}/20,000</span></div>
            </section>
            <section className="panel resume-panel"><div className="panel-heading"><span className="heading-icon purple"><Icon name="file" size={18}/></span><div><h2>Your resume</h2><p>Upload a current version to compare</p></div><span className="step-number">02</span></div>
              <label className={`drop-zone ${resume ? "has-file" : ""}`} htmlFor="resume-file"><span className="upload-icon"><Icon name="upload" size={25}/></span><strong>{resume ? "Resume ready to analyze" : "Drop your resume here"}</strong><span>{resume ? "Choose another file if you need to" : "PDF or DOCX · Maximum 5 MB"}</span><span className="choose-file">Browse files</span><input id="resume-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange}/></label>
              {resume ? <div className="file-row"><span className="file-icon"><Icon name="file" size={18}/></span><span className="file-name"><b>{resume.name}</b><small>{(resume.size / 1024).toFixed(0)} KB · Ready</small></span><button className="remove-file" type="button" aria-label="Remove resume" onClick={() => setResume(null)}><Icon name="close" size={17}/></button></div> : <div className="privacy-note"><Icon name="check" size={15}/> Your resume is processed by the backend for analysis.</div>}
              <button className="primary-button analyze-button" type="submit" disabled={loading}>{loading ? <span className="spinner"/> : <Icon name="spark" size={17}/>} {loading ? "Analyzing your resume…" : "Analyze my match"}<span className="button-arrow">→</span></button><button className="demo-button" type="button" onClick={loadDemo}>Preview with sample results</button>
            </section>
          </form>
          {error && <div className="error-banner" role="alert"><Icon name="alert" size={18}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><Icon name="close" size={16}/></button></div>}

          <section id="analysis-results" className="results-section"><div className="results-title-row"><div><div className="eyebrow"><Icon name="spark" size={14}/> YOUR REPORT</div><h2>Analysis overview</h2><p>{result ? (result.demo ? "Sample report preview · illustrative data" : "Based on the job description and resume you submitted") : "Your results will appear here after you analyze a resume."}</p></div>{result && <button className="outline-button" onClick={() => window.print()}><Icon name="download" size={16}/> Export report</button>}</div>
            {result ? <>
              <div className="tabs-row">{["Analysis", "Job requirements", "Keywords", "AI suggestions"].map(tab => <button key={tab} className={`result-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
              {activeTab === "Analysis" && <>
                <div className="overview-grid"><article className="panel score-card"><div className="score-ring" style={{background:`conic-gradient(${scoreColor} ${result.score * 3.6}deg, #edf0f7 0deg)`}}><div className="score-inner"><strong>{result.score}</strong><span>/ 100</span></div></div><div className="score-copy"><span className="match-pill" style={{color:scoreColor,background:`${scoreColor}14`}}>{result.score >= 75 ? "Strong match" : result.score >= 50 ? "Partial match" : "Needs work"}</span><h3>Overall match score</h3><p>{result.summary}</p><small>Use this as guidance, not a hiring prediction.</small></div></article>
                  <article className="panel breakdown-card"><div className="card-title"><h3>Match breakdown</h3><span className="muted-label">By category</span></div>{[{name:"Skills match",value:Math.min(100,Math.round(result.matchedSkills.length / Math.max(1,result.matchedSkills.length+result.partialSkills.length+result.missingSkills.length)*100))},{name:"Required skills",value:Math.max(10,Math.round((result.matchedSkills.length+result.partialSkills.length*.5)/Math.max(1,result.matchedSkills.length+result.partialSkills.length+result.missingSkills.length)*100))},{name:"Keyword coverage",value:Math.round((result.keywords.filter(k=>k.status==="found").length/Math.max(1,result.keywords.length))*100)}].map((item,i)=><div className="bar-row" key={item.name}><div><span>{item.name}</span><b>{item.value}%</b></div><div className="bar-track"><span className={`bar-fill fill-${i}`} style={{width:`${item.value}%`}}/></div></div>)}</article>
                  <article className="panel stats-card"><div className="card-title"><h3>At a glance</h3></div><div className="stat-grid"><div className="stat-item"><span className="stat-icon blue"><Icon name="file" size={17}/></span><div><strong>{result.matchedSkills.length+result.partialSkills.length+result.missingSkills.length}</strong><small>Skills reviewed</small></div></div><div className="stat-item"><span className="stat-icon green"><Icon name="check" size={17}/></span><div><strong>{result.matchedSkills.length}</strong><small>Matched</small></div></div><div className="stat-item"><span className="stat-icon red"><Icon name="alert" size={17}/></span><div><strong>{result.missingSkills.length}</strong><small>Potential gaps</small></div></div><div className="stat-item"><span className="stat-icon purple"><Icon name="spark" size={17}/></span><div><strong>{result.keywords.filter(k=>k.status==="found").length}/{result.keywords.length}</strong><small>Keywords found</small></div></div></div></article></div>
                <div className="skill-grid"><article className="panel skill-card"><div className="card-title"><h3><span className="status-dot green-dot"/> Matched skills</h3><span className="count-badge green-badge">{result.matchedSkills.length}</span></div><div className="skill-tags">{result.matchedSkills.map(s=><span className="skill-tag matched" key={s.name}><Icon name="check" size={12}/>{s.name}</span>)}</div></article><article className="panel skill-card"><div className="card-title"><h3><span className="status-dot amber-dot"/> Partially matched</h3><span className="count-badge amber-badge">{result.partialSkills.length}</span></div><div className="skill-list">{result.partialSkills.map(s=><div className="skill-list-row" key={s.name}><span className="mini-status partial">!</span><div><b>{s.name}</b><small>{s.evidence}</small></div></div>)}</div></article><article className="panel skill-card"><div className="card-title"><h3><span className="status-dot red-dot"/> Potential gaps</h3><span className="count-badge red-badge">{result.missingSkills.length}</span></div><div className="skill-list">{result.missingSkills.map(s=><div className="skill-list-row" key={s.name}><span className="mini-status missing">×</span><div><b>{s.name}</b><small>{s.evidence}</small></div></div>)}</div></article></div>
                <div className="lower-grid"><article className="panel keywords-card"><div className="card-title"><h3>Important keywords</h3><button className="text-button" onClick={()=>setShowAllKeywords(v=>!v)}>{showAllKeywords ? "Show less" : "View all"} →</button></div><div className="keyword-legend"><span><i className="legend-dot found"/> Found</span><span><i className="legend-dot partial"/> Partial</span><span><i className="legend-dot missing"/> Missing</span></div><div className="keyword-cloud">{visibleKeywords.map(k=><span key={k.name} className={`keyword-chip ${k.status}`}>{k.status==="found"?"✓":k.status==="partial"?"◐":"+"} {k.name}</span>)}</div></article><article className="panel suggestions-card"><div className="card-title"><h3><span className="bulb">✦</span> AI suggestions</h3><span className="muted-label">Recommended next steps</span></div><div className="suggestion-list">{result.suggestions.map((s,i)=><div className="suggestion-row" key={s.title}><span className="suggestion-number">{i+1}</span><div><b>{s.title}</b><p>{s.detail}</p></div></div>)}</div></article></div>
              </>}
              {activeTab === "Job requirements" && <article className="panel tab-panel"><h3>Requirements identified</h3><p className="panel-subtitle">These are the requirements extracted from the job description.</p><ul className="requirement-list">{result.requirements.map((r,i)=><li key={r}><span>{i+1}</span>{r}</li>)}</ul><h3 className="section-subhead">Skills to review</h3><div className="skill-tags">{[...result.partialSkills,...result.missingSkills].map(s=><span className="skill-tag needs-review" key={s.name}>{s.name}</span>)}</div></article>}
              {activeTab === "Keywords" && <article className="panel tab-panel"><h3>Keyword coverage</h3><p className="panel-subtitle">Keywords are based on the supplied job description and should only be added to your resume when they accurately reflect your experience.</p><div className="keyword-cloud large-cloud">{result.keywords.map(k=><span key={k.name} className={`keyword-chip ${k.status}`}>{k.status.toUpperCase()} · {k.name}</span>)}</div></article>}
              {activeTab === "AI suggestions" && <article className="panel tab-panel"><h3>Resume improvement plan</h3><p className="panel-subtitle">Use these ideas to make relevant experience easier for a recruiter to identify. Never claim skills or results you do not have.</p><div className="suggestion-list expanded">{result.suggestions.map((s,i)=><div className="suggestion-row" key={s.title}><span className="suggestion-number">{i+1}</span><div><b>{s.title}</b><p>{s.detail}</p></div></div>)}</div></article>}
              <div className="disclaimer"><Icon name="alert" size={15}/> AI-generated analysis can be imperfect. Verify every suggestion against your actual experience before editing your resume.</div>
            </> : <div className="empty-state panel"><div className="empty-illustration"><Icon name="file" size={32}/><span><Icon name="spark" size={18}/></span></div><h3>Your career report starts here</h3><p>Enter a job description, upload your resume, and select <b>Analyze my match</b> to see your skills alignment and tailored recommendations.</p><button className="outline-button" onClick={loadDemo}>Explore a sample report <span>→</span></button></div>}
          </section>
          <footer className="page-footer"><span>AIAnalyzer <span className="footer-dot">·</span> Make your next move with confidence</span><span>Built for your career journey</span></footer>
        </div>
      </main>
    </div>
  );
}
