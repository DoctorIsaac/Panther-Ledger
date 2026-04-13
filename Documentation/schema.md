# FinanceTracker MongoDB Schema

```mermaid
erDiagram
    users {
        ObjectId _id PK
        string user_number
        string username
        string password
        string first_name
        string last_name
        string email
        string phone_num
        string address
        string zip_code
    }

    category {
        ObjectId _id PK
        ObjectId user_id FK
        int category_id
        string name
        string description
        bool is_active
        datetime created_at
        datetime updated_at
    }

    expense_entry {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId category_ref FK
        ObjectId document_ref FK
        int expense_id
        string name
        Decimal128 amount
        string expense_type
        string description
        string purchase_date
        bool is_active
        bool is_recurring
        string frequency
        datetime created_at
        datetime updated_at
    }

    document {
        ObjectId _id PK
        ObjectId user_id FK
        int document_id
        string file_name
        string description
        string file_type
        string account_type
        int[] linked_expense_ids
        ObjectId[] linked_expense_object_ids FK
        string parsed_status
        bool is_active
        datetime created_at
        datetime updated_at
    }

    counters {
        string key PK
        int seq
    }

    users ||--o{ category : "owns"
    users ||--o{ expense_entry : "owns"
    users ||--o{ document : "owns"
    category ||--o{ expense_entry : "categorizes"
    document ||--o{ expense_entry : "links"
```

> **Note:** `expense_type` is an enum: `"deposit"` or `"expense"`  
> `document_ref` on `expense_entry` is nullable (optional link)  
> `linked_expense_ids` stores integer IDs; `linked_expense_object_ids` stores the corresponding ObjectIds
