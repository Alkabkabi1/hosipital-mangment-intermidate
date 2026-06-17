# 📊 Hospital Management System - Mermaid Diagrams
## For PMP Document Appendices

All diagrams are in Mermaid format for easy rendering and embedding.

---

## Diagram 1: System Architecture (Three-Tier Architecture)

```mermaid
graph TB
    subgraph Presentation["PRESENTATION LAYER - Frontend Client"]
        Browser1[Web Browser Desktop]
        Browser2[Mobile Browser]
        Browser3[Tablet Browser]
        Frontend[HTML5 + CSS3 + JavaScript<br/>Responsive Design<br/>AJAX/Fetch API<br/>Client Validation<br/>Arabic/English UI]
        
        Browser1 --> Frontend
        Browser2 --> Frontend
        Browser3 --> Frontend
    end
    
    subgraph Business["BUSINESS LOGIC LAYER - Backend Server"]
        Server[Node.js / Express Server]
        
        AuthMod[Auth Module<br/>Login, Logout, Sessions]
        ReqMod[Request Module<br/>Clearance, Onboarding, Delegation]
        AdminMod[Admin Module<br/>Users, Employees, Roles]
        EmpMod[Employee Management<br/>Credentials, Profile, Documents]
        LeaveMod[Leave Module<br/>Requests, Maternity, Travel]
        ApprovalMod[Approval Management<br/>Multi-level, Workflow, Audit]
        MW[Middleware<br/>Authentication JWT<br/>Authorization RBAC<br/>Validation & Logging]
        
        Server --> AuthMod
        Server --> ReqMod
        Server --> AdminMod
        Server --> EmpMod
        Server --> LeaveMod
        Server --> ApprovalMod
        Server --> MW
    end
    
    subgraph Data["DATA LAYER - Database & Storage"]
        DB[(MySQL Database Server)]
        
        Users[(Users Table)]
        Employees[(Employees Table)]
        Requests[(Requests Tables)]
        Roles[(Roles Table)]
        Approvals[(Approvals Table)]
        Audit[(Audit Table)]
        
        FileStorage[File Storage System<br/>Documents, Certificates, Attachments]
        
        DB --> Users
        DB --> Employees
        DB --> Requests
        DB --> Roles
        DB --> Approvals
        DB --> Audit
    end
    
    Frontend -->|HTTPS/REST API| Server
    MW -->|SQL Queries| DB
    Server --> FileStorage
    
    style Frontend fill:#e1f5ff
    style Server fill:#fff4e1
    style DB fill:#e8f5e9
    style MW fill:#fce4ec
```

---

## Diagram 2: System Components and Integration

```mermaid
graph TB
    subgraph External["EXTERNAL INTEGRATIONS"]
        Email[Email Service SMTP]
        SMS[SMS Gateway]
        Payment[Payment Gateway]
    end
    
    subgraph HMS["HOSPITAL MANAGEMENT SYSTEM"]
        WebServer[Web Server<br/>HTTP/HTTPS Handler<br/>Static Files<br/>Load Balancing]
        
        Auth[Authentication Service<br/>JWT Tokens<br/>Session Management]
        AuthZ[Authorization Service<br/>RBAC<br/>Permissions]
        ReqMgr[Request Manager<br/>Clearance, Onboarding<br/>Leave, Delegation]
        Workflow[Approval Workflow<br/>Multi-level<br/>Rules Engine]
        Notif[Notification Service<br/>Real-time<br/>Email/SMS]
        Report[Report Generator<br/>Statistics<br/>Export PDF]
        AuditLog[Audit Logger<br/>User Actions<br/>System Events]
        FileMgr[File Manager<br/>Upload/Download]
        
        ConnPool[Database Connection Pool<br/>Connection Management<br/>Query Optimization<br/>Transaction Management]
        
        UserDB[(User Database<br/>App_Users<br/>Employees<br/>Roles)]
        RequestDB[(Request DB<br/>Clearance<br/>Onboarding<br/>Delegation)]
        SystemDB[(System DB<br/>Audit_Log<br/>Settings<br/>Notifications)]
    end
    
    Email -.->|SMTP| Notif
    SMS -.->|API| Notif
    Payment -.->|API| WebServer
    
    WebServer --> Auth
    WebServer --> AuthZ
    Auth --> ReqMgr
    AuthZ --> ReqMgr
    ReqMgr --> Workflow
    Workflow --> Notif
    ReqMgr --> Report
    Auth --> AuditLog
    AuthZ --> AuditLog
    ReqMgr --> FileMgr
    
    Auth --> ConnPool
    AuthZ --> ConnPool
    ReqMgr --> ConnPool
    Workflow --> ConnPool
    AuditLog --> ConnPool
    
    ConnPool --> UserDB
    ConnPool --> RequestDB
    ConnPool --> SystemDB
    
    style Email fill:#ffebee
    style SMS fill:#ffebee
    style Payment fill:#ffebee
    style WebServer fill:#e3f2fd
    style ConnPool fill:#f3e5f5
    style UserDB fill:#e8f5e9
    style RequestDB fill:#e8f5e9
    style SystemDB fill:#e8f5e9
```

---

## Diagram 3: Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    DEPARTMENTS ||--o{ JOB_TITLES : contains
    DEPARTMENTS ||--o{ EMPLOYEES : has
    JOB_TITLES ||--o{ EMPLOYEES : assigned_to
    APP_USERS ||--|| EMPLOYEES : has_profile
    EMPLOYEES ||--o{ CLEARANCE_REQUESTS : submits
    EMPLOYEES ||--o{ ONBOARDING_REQUESTS : creates
    EMPLOYEES ||--o{ DELEGATION_REQUESTS : delegates
    EMPLOYEES ||--o{ LEAVE_REQUESTS : requests
    APP_USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    REQUEST_APPROVALS }o--|| EMPLOYEES : approved_by
    APP_USERS ||--o{ AUDIT_EVENTS : performs
    APP_USERS ||--o{ NOTIFICATIONS : receives

    DEPARTMENTS {
        int id PK
        string name
        string description
        datetime created_at
    }

    JOB_TITLES {
        int id PK
        int department_id FK
        string title
        string description
        datetime created_at
    }

    APP_USERS {
        int id PK
        string email UK
        string username UK
        string password_hash
        string full_name
        datetime created_at
    }

    EMPLOYEES {
        int id PK
        int user_id FK
        int department_id FK
        int job_title_id FK
        string employee_number UK
        string national_id UK
        string phone
        date hire_date
        string status
        datetime created_at
    }

    ROLES {
        int id PK
        string name UK
        string description
        datetime created_at
    }

    USER_ROLES {
        int id PK
        int user_id FK
        int role_id FK
        datetime assigned_at
        datetime expires_at
    }

    CLEARANCE_REQUESTS {
        int id PK
        int employee_id FK
        string clearance_type
        string reason
        string status
        datetime submitted_at
    }

    ONBOARDING_REQUESTS {
        int id PK
        string employee_name
        string national_id
        string position
        string department
        string status
        datetime created_at
    }

    DELEGATION_REQUESTS {
        int id PK
        int delegator_id FK
        int delegate_id FK
        date start_date
        date end_date
        string status
        datetime created_at
    }

    LEAVE_REQUESTS {
        int id PK
        int employee_id FK
        string leave_type
        date start_date
        date end_date
        int days_count
        string reason
        string status
        datetime created_at
    }

    REQUEST_APPROVALS {
        int id PK
        string request_type
        int request_id
        int approver_id FK
        string status
        text comments
        datetime approved_at
        datetime created_at
    }

    AUDIT_EVENTS {
        int id PK
        int user_id FK
        string event_type
        text description
        string ip_address
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string type
        string title
        text message
        boolean is_read
        datetime created_at
    }
```

---

## Diagram 4: Request Workflow and Approval Process

```mermaid
flowchart TD
    Start([Employee Submits Request]) --> Create[Request Created<br/>Status: pending]
    Create --> Engine[Approval Rules Engine<br/>Check request type<br/>Determine levels<br/>Identify approvers]
    
    Engine --> Approvals[Create Approval Records]
    
    Approvals --> L1{Level 1<br/>Direct Manager}
    
    L1 -->|Approve| L2{Level 2<br/>Department Head}
    L1 -->|Reject| Rejected[Request REJECTED<br/>Status: rejected]
    L1 -->|Return| Return[Back to Employee<br/>for Revision]
    L1 -->|Timeout| Escalate[Auto Escalate<br/>or Reject]
    
    L2 -->|Approve| L3{Level 3<br/>HR Manager}
    L2 -->|Reject| Rejected
    
    L3 -->|Approve| Approved[Request APPROVED<br/>Status: approved]
    L3 -->|Reject| Rejected
    
    Approved --> PostProcess[Post-Processing<br/>Update status<br/>Send notifications<br/>Log audit<br/>Trigger actions]
    Rejected --> PostProcess
    Return --> PostProcess
    Escalate --> PostProcess
    
    PostProcess --> Notify[Notify Employee<br/>Email, SMS<br/>In-app<br/>Dashboard]
    
    Notify --> End([End])
    
    style Start fill:#e8f5e9
    style Create fill:#fff3e0
    style Engine fill:#e1f5fe
    style L1 fill:#fff9c4
    style L2 fill:#fff9c4
    style L3 fill:#fff9c4
    style Approved fill:#c8e6c9
    style Rejected fill:#ffcdd2
    style Return fill:#ffe0b2
    style Notify fill:#e1bee7
    style End fill:#e8f5e9
```

---

## Diagram 5: User Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant User as Browser/User
    participant Auth as Auth Controller
    participant DB as Database
    participant JWT as JWT Service
    participant Audit as Audit Logger
    participant Middleware as Auth Middleware
    participant API as API Endpoint

    Note over User,API: LOGIN PROCESS
    User->>+Auth: POST /api/auth/login<br/>{email, password}
    Auth->>+DB: SELECT * FROM App_Users<br/>WHERE email = ?
    
    alt User Not Found
        DB-->>Auth: No user found
        Auth-->>User: 401 Invalid credentials
    else User Found
        DB-->>-Auth: User record
        Auth->>Auth: Verify password<br/>(bcrypt compare)
        
        alt Password Invalid
            Auth-->>User: 401 Invalid credentials
        else Password Valid
            Auth->>+DB: Fetch user roles & permissions
            DB-->>-Auth: Roles & permissions
            Auth->>+JWT: Generate JWT token
            JWT-->>-Auth: Signed token
            Auth->>Audit: Log login event
            Audit->>DB: INSERT INTO Audit_Events
            Auth-->>-User: 200 OK<br/>{token, user}
            User->>User: Store token in localStorage
        end
    end

    Note over User,API: ACCESSING PROTECTED RESOURCE
    User->>+Middleware: GET /api/employee/requests<br/>Authorization: Bearer <token>
    
    alt No Token
        Middleware-->>User: 401 Unauthorized<br/>No token
    else Token Present
        Middleware->>Middleware: Verify JWT signature<br/>& expiration
        
        alt Invalid Token
            Middleware-->>User: 401 Unauthorized<br/>Invalid token
        else Valid Token
            Middleware->>Middleware: Check permissions<br/>(RBAC)
            
            alt No Permission
                Middleware-->>User: 403 Forbidden<br/>No permission
            else Has Permission
                Middleware->>+API: Forward request
                API->>DB: Query data
                DB-->>API: Return data
                API-->>-Middleware: Response
                Middleware-->>-User: 200 OK<br/>{data}
            end
        end
    end
```

---

## Diagram 6: API Endpoints Structure

```mermaid
graph TB
    API["/api<br/>Base API Endpoint"]
    
    API --> Health["/health<br/>GET: System Health"]
    
    API --> Auth["/auth<br/>Authentication"]
    Auth --> Login["/login POST"]
    Auth --> Logout["/logout POST"]
    Auth --> Refresh["/refresh POST"]
    
    API --> Admin["/admin<br/>Administration"]
    Admin --> AdminUsers["/users GET/POST"]
    Admin --> AdminEmployees["/employees GET/PUT"]
    Admin --> AdminClearance["/clearance GET"]
    
    API --> Profile["/profile<br/>GET/PUT"]
    
    API --> Roles["/roles<br/>CRUD Operations"]
    
    API --> Users["/users<br/>User Management"]
    
    API --> Clearance["/clearance<br/>Clearance Requests"]
    
    API --> Onboarding["/onboarding<br/>New Employee"]
    
    API --> Delegation["/delegation<br/>Delegation Requests"]
    
    API --> Leave["/leave-request<br/>Leave Management"]
    
    API --> Maternity["/maternity-leave<br/>Maternity Requests"]
    
    API --> Travel["/travel-order<br/>Travel Orders"]
    
    API --> Housing["/housing-allowance<br/>Housing Requests"]
    
    API --> Certificate["/certificate<br/>Certificate Requests"]
    
    API --> Experience["/experience-certificate<br/>Experience Certs"]
    
    API --> Transfer["/internal-transfer<br/>Transfer Requests"]
    
    API --> Assignment["/assignment<br/>Assignment Requests"]
    
    API --> Termination["/assignment-termination<br/>Termination Requests"]
    
    API --> Exit["/exit<br/>Exit Requests"]
    
    API --> MultiApproval["/multi-approval<br/>Approval System"]
    MultiApproval --> Pending["/pending GET"]
    MultiApproval --> Approve["/id/approve POST"]
    MultiApproval --> Reject["/id/reject POST"]
    
    API --> Commissioner["/commissioner/tickets<br/>Ticket System"]
    
    API --> Upload["/upload<br/>File Upload POST"]
    
    style API fill:#4CAF50,color:#fff
    style Auth fill:#2196F3,color:#fff
    style Admin fill:#FF9800,color:#fff
    style MultiApproval fill:#9C27B0,color:#fff
```

---

## Diagram 7: Deployment Architecture (Production)

```mermaid
graph TB
    Internet((Internet))
    
    Internet --> Firewall[Firewall / WAF<br/>Web Application Firewall]
    
    Firewall --> LB[Load Balancer<br/>nginx/HAProxy<br/>SSL Termination<br/>Traffic Distribution]
    
    LB --> Web1[Web Server 1<br/>nginx<br/>Static Files<br/>Reverse Proxy]
    LB --> Web2[Web Server 2<br/>nginx<br/>Static Files<br/>Reverse Proxy]
    LB --> Web3[Web Server 3<br/>nginx<br/>Static Files<br/>Reverse Proxy]
    
    Web1 --> Gateway[API Gateway Optional<br/>Rate Limiting<br/>API Versioning]
    Web2 --> Gateway
    Web3 --> Gateway
    
    Gateway --> App1[App Server 1<br/>Node.js Express<br/>Business Logic]
    Gateway --> App2[App Server 2<br/>Node.js Express<br/>Business Logic]
    Gateway --> App3[App Server 3<br/>Node.js Express<br/>Business Logic]
    
    App1 --> Primary
    App2 --> Primary
    App3 --> Primary
    
    Primary[(MySQL Primary<br/>Read/Write)]
    Replica1[(MySQL Replica 1<br/>Read-Only)]
    Replica2[(MySQL Replica 2<br/>Read-Only)]
    
    Primary --> Replica1
    Primary --> Replica2
    
    Primary --> Backup[(Backup Storage<br/>Daily Backups<br/>Disaster Recovery)]
    
    App1 --> Redis[Redis Cache<br/>Session<br/>Temp Data]
    App2 --> Redis
    App3 --> Redis
    
    App1 --> FileStorage[File Storage<br/>Documents<br/>Attachments]
    App2 --> FileStorage
    App3 --> FileStorage
    
    App1 --> Email[Email Service<br/>SMTP]
    App1 --> SMS[SMS Gateway]
    App1 --> Monitor[Monitoring<br/>Logs Metrics Alerts]
    
    style Internet fill:#e3f2fd
    style Firewall fill:#ffebee
    style LB fill:#f3e5f5
    style Primary fill:#e8f5e9
    style Replica1 fill:#e8f5e9
    style Replica2 fill:#e8f5e9
    style Redis fill:#fff3e0
    style FileStorage fill:#fce4ec
    style Monitor fill:#e0f2f1
```

---

## Diagram 8: Development & Testing Pipeline (CI/CD)

```mermaid
graph TB
    Dev[Developer Workstation<br/>VS Code<br/>Local Git Repo]
    
    Dev -->|git push| GitRepo[Git Repository<br/>GitHub/GitLab]
    
    GitRepo -->|Webhook trigger| Pipeline[CI/CD Pipeline<br/>Jenkins/GitHub Actions]
    
    subgraph "BUILD STAGE"
        Pipeline --> Install[Install Dependencies<br/>npm install]
        Install --> Compile[TypeScript Compilation<br/>tsc]
        Compile --> Bundle[Bundle Assets]
        Bundle --> Lint[Run Linters<br/>ESLint]
        Lint --> Quality[Code Quality Checks]
    end
    
    Quality -->|Success?| TestStage{Test Stage}
    Quality -->|Fail| NotifyFail1[Notify Developer<br/>Build Failed]
    
    subgraph "TEST STAGE"
        TestStage --> UnitTest[Unit Tests<br/>Jest<br/>80%+ Coverage]
        UnitTest --> IntegrationTest[Integration Tests<br/>API Tests<br/>DB Tests]
        IntegrationTest --> SecurityTest[Security Tests<br/>OWASP Checks<br/>Dependencies]
        SecurityTest --> Coverage[Code Coverage<br/>Report]
    end
    
    Coverage -->|Pass?| DeployStage{Deploy Stage}
    Coverage -->|Fail| NotifyFail2[Notify Developer<br/>Tests Failed]
    
    subgraph "DEPLOYMENT"
        DeployStage -->|Dev Branch| DevEnv[DEV Environment<br/>Auto-deploy<br/>Latest Features<br/>Developer Testing]
        
        DeployStage -->|Staging Branch| StagingEnv[STAGING Environment<br/>Production Replica<br/>UAT Testing<br/>Performance Testing]
        
        DeployStage -->|Main Branch + Approval| ProdEnv[PRODUCTION Environment<br/>Live System<br/>Real Users<br/>Zero Downtime<br/>Rollback Ready]
    end
    
    DevEnv --> Monitor1[Monitor<br/>Basic]
    StagingEnv --> Monitor2[Monitor<br/>Full]
    ProdEnv --> Monitor3[Monitor<br/>24/7 Alerts]
    
    ProdEnv -->|Issues?| Rollback[Rollback Plan<br/>< 2 hours]
    
    style Dev fill:#e8f5e9
    style GitRepo fill:#fff3e0
    style Pipeline fill:#e1f5fe
    style TestStage fill:#f3e5f5
    style DeployStage fill:#fff9c4
    style DevEnv fill:#c8e6c9
    style StagingEnv fill:#fff4e1
    style ProdEnv fill:#bbdefb
    style NotifyFail1 fill:#ffcdd2
    style NotifyFail2 fill:#ffcdd2
    style Rollback fill:#ffab91
```

---

## How to Use These Mermaid Diagrams

### Method 1: Render in Markdown Viewers
- GitHub, GitLab, and many modern markdown editors support Mermaid automatically
- Just view this file and the diagrams will render

### Method 2: Export as Images
1. **Using Mermaid Live Editor:**
   - Go to https://mermaid.live
   - Copy and paste each diagram
   - Click "Actions" → "PNG" or "SVG"
   - Download and insert into Word document

2. **Using VS Code:**
   - Install "Markdown Preview Mermaid Support" extension
   - Open this file
   - Right-click on preview → "Save as Image"

3. **Using Command Line:**
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   mmdc -i DIAGRAMS_MERMAID.md -o diagrams/
   ```

### Method 3: Embed in Documentation
- Many documentation tools (GitBook, Docusaurus, MkDocs) support Mermaid natively
- Confluence and Notion have Mermaid plugins

### Method 4: Screenshot from Web
- Use Mermaid Live Editor (https://mermaid.live)
- Take high-quality screenshots
- Insert into your PMP document

---

## Diagram Details

### Diagram 1: System Architecture
Shows the three-tier architecture with frontend, backend, and database layers.

### Diagram 2: System Components
Illustrates the integration between internal modules and external services.

### Diagram 3: ERD
Complete entity-relationship diagram showing all database tables and their relationships.

### Diagram 4: Workflow
Depicts the multi-level approval process for requests.

### Diagram 5: Auth Flow
Sequence diagram showing authentication and authorization process.

### Diagram 6: API Structure
Visual representation of all API endpoints organized by module.

### Diagram 7: Deployment
Production deployment architecture with load balancing and redundancy.

### Diagram 8: CI/CD Pipeline
Development and testing workflow from code commit to production.

---

**Generated For:**
- Project: Hospital Management System
- Organization: مستشفى الملك عبد العزيز  
- Version: 1.0
- Date: November 19, 2025
- Prepared by: نوره محمد الكبكبي

