import os
import requests
import streamlit as st
from dotenv import load_dotenv, set_key
from pathlib import Path

load_dotenv()

ENV_PATH = Path(__file__).parent.parent / ".env"

st.set_page_config(page_title="FlightDesk · Settings", page_icon="⚙️", layout="centered")

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
html,body,[class*="css"]{font-family:'Inter',sans-serif;}
.stApp{background:linear-gradient(135deg,#0A0F1E 0%,#0d1829 50%,#0A0F1E 100%)!important;}
.main .block-container{max-width:680px!important;padding:2.5rem 2rem 4rem!important;}
h1,h2,h3{color:#F9FAFB!important;}
p,label{color:#9CA3AF!important;}
.stTextInput input{
    background:rgba(4,9,20,0.9)!important;border-color:rgba(37,99,235,0.25)!important;
    color:#e2e8f0!important;border-radius:10px!important;font-size:0.875rem!important;
}
.stTextInput input:focus{border-color:rgba(37,99,235,0.6)!important;box-shadow:0 0 0 3px rgba(37,99,235,0.1)!important;}
.stButton>button{
    background:linear-gradient(135deg,#2563EB,#6366f1)!important;color:#fff!important;
    border:none!important;border-radius:10px!important;font-weight:600!important;
    font-size:0.875rem!important;padding:0.55rem 1.25rem!important;
    box-shadow:0 2px 12px rgba(37,99,235,0.25)!important;
}
.stButton>button:hover{transform:translateY(-1px)!important;box-shadow:0 6px 24px rgba(37,99,235,0.4)!important;}
.stButton>button:disabled{background:rgba(51,65,85,0.4)!important;color:#334155!important;box-shadow:none!important;transform:none!important;}
div[data-testid="stInfo"]{background:rgba(37,99,235,0.07)!important;border-left-color:#2563EB!important;color:#93C5FD!important;border-radius:10px!important;}
div[data-testid="stSuccess"]{background:rgba(16,185,129,0.07)!important;border-left-color:#10b981!important;color:#6ee7b7!important;border-radius:10px!important;}
div[data-testid="stError"]{background:rgba(239,68,68,0.07)!important;border-left-color:#ef4444!important;color:#fca5a5!important;border-radius:10px!important;}
hr{border:none!important;border-top:1px solid rgba(37,99,235,0.08)!important;margin:1.5rem 0!important;}
.key-card{
    background:rgba(17,24,39,0.85);border:1px solid rgba(37,99,235,0.12);
    border-radius:14px;padding:1.25rem 1.5rem;margin-bottom:1rem;
}
</style>
""", unsafe_allow_html=True)

st.markdown(
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:0.25rem;">'
    '<div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#2563EB,#6366F1);'
    'display:flex;align-items:center;justify-content:center;font-size:16px;'
    'box-shadow:0 0 0 1px rgba(255,255,255,0.1),0 6px 18px -8px rgba(99,102,241,0.7);">⚙️</div>'
    '<div><div style="font-size:1.3rem;font-weight:700;color:#F9FAFB;letter-spacing:-0.02em;">Settings</div>'
    '<div style="font-size:12px;color:#4B5563;margin-top:1px;">API keys · FlightDesk configuration</div></div>'
    '</div>',
    unsafe_allow_html=True,
)

st.divider()

# ── SerpAPI ────────────────────────────────────────────────────
st.markdown("### SerpAPI Key")
st.caption("Used for Google Flights live fare search. Required for searching flights.")
serp_val = os.getenv("SERPAPI_KEY", "")
new_serp = st.text_input("SerpAPI key", value=serp_val, type="password",
                          placeholder="sk-serp-…", label_visibility="collapsed")

_tc1, _tc2 = st.columns([1, 4])
with _tc1:
    if st.button("Test key", use_container_width=True):
        if not new_serp:
            st.error("Enter a key first.")
        else:
            try:
                r = requests.get("https://serpapi.com/account",
                                 params={"api_key": new_serp}, timeout=10).json()
                if "error" in r:
                    st.error(f"❌  {r['error']}")
                else:
                    st.success(f"✅  {r.get('searches_left_this_month', '?')} searches left this month")
            except Exception as e:
                st.error(f"❌  {e}")

st.divider()

# ── Anthropic ──────────────────────────────────────────────────
st.markdown("### Anthropic API Key")
st.caption("Powers AI vibe search — \"beaches SE Asia\", \"budget Europe\". Optional; fuzzy search works without it.")
anth_val = os.getenv("ANTHROPIC_KEY", "")
new_anth = st.text_input("Anthropic key", value=anth_val, type="password",
                          placeholder="sk-ant-…", label_visibility="collapsed")

st.divider()

# ── Save ───────────────────────────────────────────────────────
_changed = (new_serp != serp_val) or (new_anth != anth_val)
if st.button("💾  Save settings", type="primary", disabled=not _changed, use_container_width=True):
    try:
        if not ENV_PATH.exists():
            ENV_PATH.write_text("")
        if new_serp != serp_val:
            set_key(str(ENV_PATH), "SERPAPI_KEY", new_serp)
        if new_anth != anth_val:
            set_key(str(ENV_PATH), "ANTHROPIC_KEY", new_anth)
        st.success("✅  Saved to .env — refresh the main FlightDesk tab to apply the new keys.")
    except Exception as e:
        st.error(f"Could not write to .env: {e}")

if not _changed:
    st.info("No changes — edit a key above to enable Save.")
