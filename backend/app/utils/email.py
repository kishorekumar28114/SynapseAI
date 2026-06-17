import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


def _build_onboarding_email(
    full_name: str,
    username: str,
    temp_password: str,
    role: str,
    manager_name: str,
) -> str:
    """Build HTML onboarding email for new employee."""
    role_display = role.replace("_", " ").title()
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.3); }}
    .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center; }}
    .logo {{ font-size: 28px; font-weight: 800; color: white; letter-spacing: -1px; }}
    .logo span {{ color: #a5f3fc; }}
    .tagline {{ color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 8px; }}
    .body {{ padding: 40px 32px; }}
    h2 {{ color: #a5b4fc; font-size: 22px; margin: 0 0 16px; }}
    p {{ color: #94a3b8; line-height: 1.7; margin: 0 0 16px; }}
    .creds-box {{ background: #0f0f1a; border: 1px solid rgba(99,102,241,0.4); border-radius: 12px; padding: 24px; margin: 24px 0; }}
    .cred-row {{ display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(99,102,241,0.15); }}
    .cred-row:last-child {{ border-bottom: none; }}
    .cred-label {{ color: #6366f1; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }}
    .cred-value {{ color: #e2e8f0; font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; background: rgba(99,102,241,0.1); padding: 4px 12px; border-radius: 6px; }}
    .badge {{ display: inline-block; background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.5); color: #a5b4fc; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 20px; }}
    .warning {{ background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px 16px; color: #fca5a5; font-size: 13px; margin-top: 16px; }}
    .footer {{ background: #0f0f1a; padding: 24px 32px; text-align: center; color: #475569; font-size: 12px; }}
    a {{ color: #6366f1; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Synapse<span>AI</span></div>
      <div class="tagline">Smart Meeting Intelligence Platform</div>
    </div>
    <div class="body">
      <div class="badge">{role_display}</div>
      <h2>Welcome aboard, {full_name}! 🎉</h2>
      <p>
        You've been invited by <strong style="color:#a5b4fc">{manager_name}</strong> to join
        <strong style="color:#a5b4fc">SynapseAI</strong> as a <strong>{role_display}</strong>.
      </p>
      <p>Here are your login credentials to get started:</p>
      <div class="creds-box">
        <div class="cred-row">
          <span class="cred-label">Username</span>
          <span class="cred-value">{username}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Password</span>
          <span class="cred-value">{temp_password}</span>
        </div>
      </div>
      <div class="warning">
        ⚠️ This is a temporary password. Please change it after your first login.
      </div>
      <p style="margin-top: 24px;">
        Log in at <a href="http://localhost:5173">http://localhost:5173</a> using your username and the password above.
      </p>
    </div>
    <div class="footer">
      © 2025 SynapseAI · Smart Meeting Intelligence · This email was sent by {manager_name}
    </div>
  </div>
</body>
</html>
"""


def send_onboarding_email(
    to_email: str,
    full_name: str,
    username: str,
    temp_password: str,
    role: str,
    manager_name: str,
) -> bool:
    """
    Send onboarding email via Gmail SMTP.
    Returns True on success, False on failure.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping email send.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Welcome to SynapseAI — Your Account is Ready 🚀"
        msg["From"] = settings.FROM_EMAIL or settings.SMTP_USER
        msg["To"] = to_email

        html_body = _build_onboarding_email(full_name, username, temp_password, role, manager_name)
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], to_email, msg.as_string())

        logger.info(f"Onboarding email sent to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
