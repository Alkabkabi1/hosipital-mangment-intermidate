# 📊 Request Forms - Visual Quick Reference Guide

## 🎯 Request Forms Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOSPITAL REQUEST MANAGEMENT SYSTEM                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  ONBOARDING  │  │   CLEARANCE  │  │  ASSIGNMENT  │  │  TRANSFER   │ │
│  │   (New Hire) │  │   (Exit)     │  │  (Delegate)  │  │  (Move)     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  DELEGATION  │  │    LEAVE     │  │     EXIT     │  │ CERTIFICATE │ │
│  │  (Authority) │  │  (Time Off)  │  │ (Resign)     │  │  (Docs)     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 1. Onboarding Request Flow

```
┌─────────────┐
│  EMPLOYEE   │ Submits onboarding request
│  (New Hire) │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ HR DEPARTMENT│ Reviews application, validates documents
│ (Level 1)    │ ✓ Check documents  ✓ Verify qualifications
└──────┬───────┘
       │ APPROVED
       ▼
┌─────────────────┐
│ DEPT. MANAGER   │ Reviews position fit, team capacity
│ (Level 2)       │ ✓ Position available  ✓ Budget approved
└─────────┬───────┘
          │ APPROVED
          ▼
┌─────────────────────┐
│ EXECUTIVE/ADMIN     │ Final approval, create account
│ (Level 3)           │ ✓ Final authorization
└─────────┬───────────┘
          │ APPROVED
          ▼
┌─────────────────────┐
│ EMPLOYEE ACCOUNT    │
│ CREATED ✓           │ → Notify employee → Welcome email
└─────────────────────┘

⏱️  Processing Time: 5-7 business days
📊 Approval Rate: ~85%
```

---

## 🚪 2. Clearance Request Flow

```
┌─────────────┐
│  EMPLOYEE   │ Submits clearance (exit) request
└──────┬──────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    MANAGER   │────▶│      HR      │────▶│   FINANCE    │
│  (Approval)  │     │  (Records)   │     │ (Settlements)│
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐            │
                     │      IT      │◀───────────┘
                     │(Asset Return)│
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │    ADMIN     │
                     │  (Final OK)  │
                     └──────┬───────┘
                            │
                     ┌──────▼───────────┐
                     │ CLEARANCE CERT   │
                     │    ISSUED ✓      │
                     └──────────────────┘

📋 Clearance Checklist:
├─ HR: Return ID badge, get service certificate
├─ Finance: Settle salary, benefits, loans, advances
├─ IT: Return laptop, phone, access cards, revoke access
└─ Admin: Return keys, documents, company property

⏱️  Processing Time: 10-15 business days
🔄 Multi-department process
```

---

## 📌 3. Assignment Request Flow

```
                    ┌─────────────┐
                    │  EMPLOYEE   │ Requests new assignment/role
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
        ┌───────────────┐     ┌───────────────┐
        │ CURRENT MGR   │     │  TARGET MGR   │
        │ (Release OK?) │     │ (Accept OK?)  │
        └───────┬───────┘     └───────┬───────┘
                │ BOTH APPROVE         │
                └──────────┬───────────┘
                           ▼
                    ┌──────────────┐
                    │      HR      │ Budget check, documentation
                    │  (Level 2)   │
                    └──────┬───────┘
                           │ APPROVED
                           ▼
                    ┌──────────────┐
                    │  EXECUTIVE   │ Final authorization
                    │  (Level 3)   │
                    └──────┬───────┘
                           │ APPROVED
                           ▼
                    ┌──────────────┐
                    │  ASSIGNMENT  │
                    │  ACTIVATED ✓ │
                    └──────────────┘

Types:
├─ Temporary: Fixed duration (3-6 months)
├─ Permanent: Long-term role change
├─ Project-based: Specific project completion
└─ Acting: Temporary replacement (by proxy)

⏱️  Processing Time: 3-5 business days
💰 May include additional allowances
```

---

## 🔄 4. Internal Transfer Flow

```
        ┌─────────────┐
        │  EMPLOYEE   │ Requests department transfer
        └──────┬──────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌─────────┐           ┌─────────┐
│ FROM    │           │   TO    │
│  DEPT   │           │  DEPT   │
│ MANAGER │           │ MANAGER │
└────┬────┘           └────┬────┘
     │ Release             │ Accept
     └──────────┬──────────┘
                ▼
         ┌──────────────┐
         │      HR      │
         │  • Position check
         │  • Budget verify
         │  • Records update
         └──────┬───────┘
                │ APPROVED
                ▼
         ┌──────────────┐
         │  EXECUTIVE   │ (for permanent transfers)
         │  (Level 3)   │
         └──────┬───────┘
                │ APPROVED
                ▼
         ┌──────────────────┐
         │ TRANSFER COMPLETE│
         │   New Position ✓ │
         └──────────────────┘

Transfer Types:
├─ Permanent: Complete move to new department
├─ Temporary: Fixed period (return to original)
└─ Secondment: Temporary loan to another dept

⏱️  Processing Time: 7-10 business days
📍 May require physical relocation
```

---

## 👥 5. Delegation Request Flow

```
┌─────────────────┐
│    DELEGATOR    │ (Employee delegating authority)
│  (Employee A)   │
└────────┬────────┘
         │
         ▼
  ┌──────────────┐
  │   MANAGER    │ Approves delegation authority
  └──────┬───────┘
         │ APPROVED
         ▼
  ┌──────────────────┐
  │     DELEGATE     │ (Must accept delegation)
  │   (Employee B)   │
  └──────┬───────────┘
         │ ACCEPTED
         ▼
  ┌──────────────┐
  │      HR      │ Documents and activates
  └──────┬───────┘
         │ ACTIVATED
         ▼
  ┌────────────────────┐
  │ DELEGATION ACTIVE  │
  │  Start: XX/XX/XXXX │
  │  End: XX/XX/XXXX   │
  └────────────────────┘
         │
         │ (on end date)
         ▼
  ┌────────────────────┐
  │ AUTO-EXPIRED OR    │
  │ MANUALLY ENDED     │
  └────────────────────┘

Delegation Types:
├─ Full Authority: All responsibilities
├─ Partial Authority: Specific tasks only
└─ Temporary: Vacation, travel, sick leave

⏱️  Processing Time: 2-3 business days
⚠️  Requires explicit acceptance by delegate
```

---

## 🏖️ 6. Leave Request Flow

```
┌─────────────┐
│  EMPLOYEE   │ Submits leave request
└──────┬──────┘
       │
       ▼
┌──────────────┐
│   MANAGER    │ Checks team coverage
│  (Level 1)   │ ✓ Team impact  ✓ Coverage plan
└──────┬───────┘
       │ APPROVED
       ▼
┌──────────────┐
│      HR      │ Verifies leave balance & policy
│  (Level 2)   │ ✓ Leave balance  ✓ Policy compliance
└──────┬───────┘
       │ APPROVED
       ▼
┌──────────────┐
│  DEPT HEAD   │ Final departmental approval
│  (Level 3)   │ ✓ Business continuity
└──────┬───────┘
       │ APPROVED
       ▼
┌──────────────────┐
│  LEAVE APPROVED  │
│   Balance Updated│ → Calendar blocked
└──────────────────┘

Leave Types:
├─ Exceptional Leave: Without salary, special circumstances
└─ Student Accompaniment: Accompanying scholarship student

⏱️  Processing Time: 3-5 business days
📅 Requires advance notice (2-4 weeks)
```

---

## 🚪 7. Exit Request Flow

```
┌─────────────┐
│  EMPLOYEE   │ Submits resignation/exit
└──────┬──────┘
       │
       ▼
┌──────────────┐
│   MANAGER    │ Reviews, may make counter-offer
│              │
└──────┬───────┘
       │
       ├─ Counter-offer Accepted → Exit Cancelled ✓
       │
       └─ Proceeding with Exit
              ▼
       ┌──────────────┐
       │      HR      │ Processes exit, schedules interview
       │              │
       └──────┬───────┘
              │
              ▼
       ┌──────────────────┐
       │ CLEARANCE PROCESS│ (See Clearance Flow Above)
       │ Multi-Department │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  EXIT COMPLETE   │
       │ Service Ends ✓   │
       └──────────────────┘

Exit Types:
├─ Resignation: Employee initiated
├─ Retirement: End of service age
└─ Contract End: Contract not renewed

⏱️  Processing Time: 30+ business days
📋 Notice Period: 30-60 days (per contract)
```

---

## 📜 8. Certificate Requests Flow

```
┌─────────────────────────────────────────────────────────┐
│                  CERTIFICATE REQUESTS                    │
└─────────────────────────────────────────────────────────┘

A) SALARY CERTIFICATE
┌─────────────┐
│  EMPLOYEE   │ → HR → Finance → Generate → Sign → Deliver
└─────────────┘
⏱️  2-3 days (Normal) | Same day (Urgent)
📄 Contains: Salary, allowances, deductions

B) EXPERIENCE CERTIFICATE
┌─────────────┐
│  EMPLOYEE   │ → Manager → HR → Generate → Sign → Deliver
└─────────────┘
⏱️  3-5 days (Normal) | 1-2 days (Urgent)
📄 Contains: Positions held, employment period, performance

Uses:
├─ Bank loans/credit
├─ Visa applications
├─ Housing contracts
├─ New job applications
└─ Government services
```

---

## 📊 Approval Hierarchy Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPROVAL LEVELS BY REQUEST TYPE                  │
├──────────────────┬─────────┬─────────┬──────────┬──────────┬───────────┤
│ REQUEST TYPE     │ Level 1 │ Level 2 │ Level 3  │ Level 4  │ Level 5   │
├──────────────────┼─────────┼─────────┼──────────┼──────────┼───────────┤
│ Onboarding       │   HR    │ Manager │Executive │    -     │     -     │
│ Clearance        │ Manager │   HR    │ Finance  │    IT    │  Admin    │
│ Assignment       │ Curr Mgr│ Targ Mgr│    HR    │Executive │     -     │
│ Assignment End   │ Asgn Mgr│ Orig Mgr│    HR    │    -     │     -     │
│ Internal Transfer│ Curr Mgr│ Targ Mgr│    HR    │Executive │     -     │
│ Delegation       │ Manager │ Delegate│    HR    │    -     │     -     │
│ Leave            │ Manager │   HR    │Dept Head │    -     │     -     │
│ Exit             │ Manager │   HR    │Multi-Dept│    -     │     -     │
│ Salary Cert      │   HR    │ Finance │    -     │    -     │     -     │
│ Experience Cert  │ Manager │   HR    │    -     │    -     │     -     │
└──────────────────┴─────────┴─────────┴──────────┴──────────┴───────────┘

Legend:
✓ Required approval
- Not applicable
Multi-Dept: Multiple departments (clearance process)
```

---

## ⏱️ Processing Time Comparison

```
FASTEST (0-3 days)
├─ Delegation Request        ████░░░░░░ 2-3 days
├─ Salary Certificate        ████░░░░░░ 2-3 days
└─ Assignment Termination    ████░░░░░░ 2-3 days

MODERATE (3-7 days)
├─ Assignment Request        ██████░░░░ 3-5 days
├─ Leave Request            ██████░░░░ 3-5 days
├─ Experience Certificate   ████████░░ 3-5 days
└─ Onboarding Request       ██████████ 5-7 days

LONGER (7-15 days)
├─ Internal Transfer        ███████████████░ 7-10 days
└─ Clearance Request        ████████████████████ 10-15 days

EXTENDED (30+ days)
└─ Exit Request             ██████████████████████████████ 30+ days
```

---

## 🎯 Quick Decision Tree

```
                    ┌─────────────────────┐
                    │ WHAT DO YOU NEED?   │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
   ┌─────────┐          ┌─────────┐          ┌──────────┐
   │  NEW    │          │ LEAVING │          │  CHANGE  │
   │  WORK   │          │  WORK   │          │   ROLE   │
   └────┬────┘          └────┬────┘          └────┬─────┘
        │                    │                     │
        ▼                    ▼                     │
 Onboarding Req         Exit Req          ┌────────┴────────┐
                        Clearance Req     ▼                 ▼
                                     Assignment      Internal Transfer
                                     
        ┌───────────────────────────────────────────┐
        │           OTHER COMMON NEEDS              │
        ├───────────────────────────────────────────┤
        │ Time Off?        → Leave Request          │
        │ Give Authority?  → Delegation Request     │
        │ Need Document?   → Certificate Request    │
        │ End Assignment?  → Assignment Termination │
        └───────────────────────────────────────────┘
```

---

## 📱 System Access Flow

```
┌────────────────────────────────────────────────────────────┐
│                     SYSTEM ACCESS                          │
└────────────────────────────────────────────────────────────┘

EMPLOYEE LOGIN
     │
     ├─▶ Employee Dashboard
     │   ├─ Submit New Request
     │   ├─ View My Requests
     │   ├─ Track Request Status
     │   └─ Upload Documents
     │
MANAGER LOGIN
     │
     ├─▶ Manager Dashboard
     │   ├─ Team Requests (Pending)
     │   ├─ Approve/Reject Requests
     │   ├─ Request Additional Info
     │   ├─ View Team History
     │   └─ Generate Reports
     │
HR LOGIN
     │
     ├─▶ HR Dashboard
     │   ├─ All Requests Overview
     │   ├─ Process Requests
     │   ├─ Generate Certificates
     │   ├─ Employee Records Access
     │   └─ System-wide Reports
     │
ADMIN LOGIN
     │
     └─▶ Admin Dashboard
         ├─ Full System Access
         ├─ Final Approvals
         ├─ User Management
         ├─ System Configuration
         └─ Audit Logs
```

---

## 🔔 Notification Flow

```
                    ┌──────────────┐
                    │   REQUEST    │
                    │   SUBMITTED  │
                    └──────┬───────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    ▼                      ▼                      ▼
┌────────┐          ┌───────────┐          ┌──────────┐
│ EMAIL  │          │ IN-SYSTEM │          │   SMS    │
│  📧    │          │  BELL 🔔  │          │   📱     │
└────────┘          └───────────┘          └──────────┘

Notification Triggers:
├─ Submission → Employee confirmation
├─ Pending → Next approver alert
├─ Approved → Employee + involved parties
├─ Rejected → Employee with reason
├─ Info Needed → Employee request
├─ Completed → All stakeholders
└─ Deadline Near → Reminder to approver

Notification Channels by Priority:
High Priority:    Email + SMS + In-System
Medium Priority:  Email + In-System
Low Priority:     In-System only
```

---

## 📈 Request Statistics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                  MONTHLY REQUEST OVERVIEW                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Requests: 1,247                                        │
│  ├─ Approved:    1,058 (85%)  ████████████████████░░░░      │
│  ├─ Rejected:      124 (10%)  ████░░░░░░░░░░░░░░░░░░░░      │
│  └─ Pending:        65 (5%)   ██░░░░░░░░░░░░░░░░░░░░░░      │
│                                                               │
│  By Type:                                                     │
│  ├─ Leave:         312 (25%)  ████████████░░░░░░░░░░░░      │
│  ├─ Certificate:   280 (22%)  ███████████░░░░░░░░░░░░░      │
│  ├─ Onboarding:    187 (15%)  ███████░░░░░░░░░░░░░░░░░      │
│  ├─ Assignment:    156 (13%)  ██████░░░░░░░░░░░░░░░░░░      │
│  ├─ Transfer:      124 (10%)  █████░░░░░░░░░░░░░░░░░░░      │
│  ├─ Delegation:     93 (7%)   ███░░░░░░░░░░░░░░░░░░░░░      │
│  ├─ Clearance:      62 (5%)   ██░░░░░░░░░░░░░░░░░░░░░░      │
│  └─ Exit:           33 (3%)   █░░░░░░░░░░░░░░░░░░░░░░░      │
│                                                               │
│  Average Processing Time: 4.2 days                            │
│  SLA Compliance: 92%                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Status Tracking Legend

```
┌────────────────────────────────────────────────────────┐
│              REQUEST STATUS INDICATORS                  │
├────────────────────────────────────────────────────────┤
│                                                          │
│  🟢 APPROVED       Request approved and completed       │
│  🟡 PENDING        Awaiting approval/action             │
│  🔵 IN REVIEW      Currently being reviewed             │
│  🟠 NEEDS INFO     Additional information required      │
│  🔴 REJECTED       Request rejected                     │
│  ⚪ DRAFT          Not yet submitted                    │
│  ⚫ CANCELLED      Cancelled by employee                │
│  🟣 PROCESSING     Being processed/implemented          │
│                                                          │
└────────────────────────────────────────────────────────┘

Progress Bar:
░░░░░░░░░░ 0%  - Just submitted
███░░░░░░░ 30% - Manager review
██████░░░░ 60% - HR processing
█████████░ 90% - Final approval
██████████ 100% - Completed
```

---

## 🎓 Training & Support

```
┌────────────────────────────────────────────────────────┐
│               NEED HELP WITH REQUESTS?                  │
├────────────────────────────────────────────────────────┤
│                                                          │
│  📚 Resources:                                          │
│  ├─ User Manual: /docs/user-manual.pdf                 │
│  ├─ Video Tutorials: internal.kauh.sa/training         │
│  ├─ FAQ: internal.kauh.sa/faq                          │
│  └─ This Guide: REQUEST_FORMS_GUIDE.md                 │
│                                                          │
│  🆘 Support Channels:                                   │
│  ├─ HR Help Desk: ext. 1234                            │
│  ├─ IT Support: ext. 5678                              │
│  ├─ Email: support@kauh.sa                             │
│  └─ Portal: internal.kauh.sa/support                   │
│                                                          │
│  ⏰ Support Hours:                                      │
│  └─ Sunday-Thursday: 8:00 AM - 4:00 PM                 │
│                                                          │
└────────────────────────────────────────────────────────┘
```

---

## 📝 Quick Tips

```
✅ DO:
├─ Submit requests with adequate notice
├─ Fill all required fields completely
├─ Attach supporting documents
├─ Check your email regularly for updates
├─ Respond promptly to information requests
└─ Keep your contact info updated

❌ DON'T:
├─ Submit duplicate requests
├─ Skip required fields
├─ Ignore notification emails
├─ Miss approval deadlines (managers)
├─ Submit last-minute urgent requests
└─ Forget to check request status
```

---

## 🎯 Success Metrics

```
┌────────────────────────────────────────────────────────┐
│           WHAT MAKES A SUCCESSFUL REQUEST?             │
├────────────────────────────────────────────────────────┤
│                                                          │
│  ✓ Complete Information        (No missing fields)     │
│  ✓ Proper Documentation        (All docs attached)     │
│  ✓ Adequate Notice            (2+ weeks advance)       │
│  ✓ Clear Justification        (Well explained)         │
│  ✓ Policy Compliance          (Follows guidelines)     │
│  ✓ Prompt Responses           (Quick communication)    │
│                                                          │
│  Result: Higher approval rate + Faster processing       │
│                                                          │
└────────────────────────────────────────────────────────┘
```

---

**🎉 You're all set! Use this guide alongside the detailed REQUEST_FORMS_GUIDE.md**

*Last Updated: November 2025*  
*For latest updates, check the internal portal or contact HR*

