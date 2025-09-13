### Supabase Database Analysis

This section is for analyzing the database schema, performance, security, and scalability. The goal is to identify potential bottlenecks, security vulnerabilities, and design flaws.

#### Prompt 1: Database Schema and Performance Review

Analyze the provided Supabase database schema.

-   **Context:** The database supports a vehicle listings website with paid features, user accounts, and media storage. The schema includes tables for listings, users, paid features, transactions, and media metadata.
-   **Task:**
    1.  Review table schemas, relationships, indexes, and data types for efficiency and correctness.
    2.  Identify potential performance bottlenecks, such as missing indexes, inefficient join operations, or denormalization issues.
    3.  Suggest schema optimizations, including appropriate indexing strategies, normalization/denormalization trade-offs, and data type adjustments.
    4.  Evaluate the security rules (Row Level Security - RLS) for each table to ensure proper access control. Check for overly permissive or restrictive policies.
    5.  Propose improvements for RLS to enforce the principle of least privilege, preventing unauthorized data access or modification.

***

### Paid Feature Rotation System and Cron Job Integrity

This section is for assessing the logic and robustness of the system that manages paid features and the associated cron jobs. The focus is on ensuring fair rotation, reliable execution, and transactional integrity.

#### Prompt 2: Paid Feature Rotation System Logic Review

Analyze the logic and integrity of the paid feature rotation system for both vehicle listings and wanted requests.

-   **Context:** The system manages several paid features, including **Boost**, **Top Spot**, **Urgent**, and **Featured**. Each has a specific duration and rotation logic.
-   **Task:**
    1.  Validate the logic for the **Top Spot** rotation system. Ensure all ads with this feature receive equal rotation time in the reserved slots.
    2.  Validate the logic for the **Boost** and **High Priority** features. Ensure daily repositioning to the top of their respective listings occurs reliably.
    3.  Assess the system's ability to handle concurrent feature activations and deactivations.
    4.  Identify potential race conditions or transactional issues that could lead to unfair rotation or failed feature application.
    5.  Suggest a robust, scalable rotation algorithm that ensures fairness and is resilient to system failures.
    6.  Review the package deals logic (**Quick Sale**, **Maximum Visibility**, **Complete Package**) to ensure features are applied correctly and for the specified durations upon purchase.

#### Prompt 3: Cron Job Reliability and Robustness

Analyze the integrity and reliability of the cron jobs that manage the paid feature system.

-   **Context:** Cron jobs are used for daily tasks such as repositioning boosted ads, rotating top spot ads, and marking features as expired.
-   **Task:**
    1.  Evaluate the cron job schedule and its efficiency.
    2.  Identify failure points, such as jobs failing to run or completing partially.
    3.  Propose a monitoring and alerting system for cron jobs to detect and report failures in real-time.
    4.  Suggest a robust retry mechanism for failed jobs to ensure data consistency.
    5.  Assess the cron jobs' transactional behavior. Ensure that operations like expiration are atomic to prevent data corruption.
    6.  Provide a plan for implementing idempotency in critical cron jobs to prevent duplicate actions if a job is accidentally run multiple times.

***

### Image Handling and Optimization

This section is for analyzing the site's image handling, which is a critical aspect of a vehicle listings website. The goal is to improve performance, user experience, and storage efficiency.

#### Prompt 4: Image Handling and Optimization

Analyze the site's current image handling system and propose improvements.

-   **Context:** Vehicle listings include multiple images per ad. Image uploads, storage, and retrieval are a key part of the user experience.
-   **Task:**
    1.  **Compression and Formats:**
        -   Analyze the current image compression and format strategy.
        -   Recommend a modern image format (e.g., WebP, AVIF) to improve load times without sacrificing quality.
        -   Propose an automated image compression pipeline for newly uploaded images.
    2.  **CDN Integration:**
        -   Evaluate the current image delivery method.
        -   Recommend the integration of a Content Delivery Network (CDN) to reduce latency and offload server resources.
        -   Provide a plan for configuring the CDN for optimal caching.
    3.  **Responsive Images:**
        -   Assess how images are displayed on different devices (desktop, mobile).
        -   Propose a responsive image strategy using HTML attributes (`srcset`, `sizes`) to serve appropriately sized images based on the user's viewport.
    4.  **Lazy Loading:**
        -   Review the current page load strategy.
        -   Recommend implementing lazy loading for images that are not immediately visible to improve initial page load times.

Analyze the provided Supabase pg_cron configuration script.

Context: The script schedules (cron-schedules.sql file) two primary jobs: a daily permanent deletion of old records and a weekly summary of pending deletions. The environment is a Supabase Postgres database.

Task:

Robustness and Error Handling: Identify the lack of explicit error handling. Propose modifications to the script to ensure the cleanup function runs within a transactional block and logs its status (success or failure) to a dedicated table.

Idempotency: Assess whether the scheduled jobs are idempotent. Explain why idempotency is crucial for cron jobs and suggest a code pattern to ensure that the permanently_delete_old_records() function does not produce unintended side effects if executed more than once.

Performance and Scalability: Evaluate the COUNT(*) queries used in the deletion-summary job. Comment on their performance impact on large tables. Propose a more efficient, scalable alternative, such as using a materialized view that is periodically refreshed by the cron job.

Monitoring: Critique the current monitoring strategy (a weekly summary log). Suggest a proactive, real-time monitoring solution for cron job failures, including a proposed table schema for a job log that records execution details.

Provide a revised, complete pg_cron script incorporating all suggested improvements.