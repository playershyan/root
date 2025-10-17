Update today's changelog with recently completed changes.

**Instructions:**

1. **Determine today's date** and construct the log file path:
   - Format: `D:\projects\root\change-logs\changelog-YYYY-MM-DD.md`
   - Example: `changelog-2025-10-17.md`

2. **Check if today's changelog exists:**
   - If EXISTS: Read it to understand existing entries
   - If NOT EXISTS: Create new file with header:
     ```markdown
     # Change Log - [Month Day, Year]

     ## Summary
     Development session started. Changes will be logged below.

     ---
     ```

3. **Append a new entry** with the following format:
```markdown
[HH:MM] - [EMOJI] [CATEGORY]: [Feature/Fix Name]
Description: [Plain English explanation of what was changed and why]
Files: file1.ts, file2.tsx
Impact: [What this affects]
```

4. **Category Emojis:**
   - 🆕 NEW FEATURE
   - ✨ IMPROVEMENT
   - 🐛 BUG FIX
   - 🔧 REFACTOR
   - 📝 CONFIG
   - 🗄️ DATABASE
   - 🎨 UI/UX
   - 📚 DOCS

5. **Update the Summary section** at the top of the file:
   - Count features added, bugs fixed, improvements made
   - One-line description of overall progress

6. **Multiple changes**: Group related changes into one logical entry

**Example Entry:**
```markdown
[14:23] - 🆕 NEW FEATURE: Context-Aware Password Management
Description: Implemented dynamic password creation/update flow based on user's
authentication method. Google/Phone users can now create passwords while email
users continue using standard password change flow.
Files: app/profile/page.tsx, app/components/security/PasswordSecurityCard.tsx,
app/api/user/password/route.ts
Impact: Users with OAuth/Phone auth can now add password login capability
```

Execute this automatically when user requests logging.
