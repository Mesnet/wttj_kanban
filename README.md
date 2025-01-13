# Collaborative Application Management - Real-Time Project

## Project Description
This project is a real-time collaborative application management tool. It allows users to update the progress of job applications and prioritize them effectively. The platform supports multi-user collaboration through a real-time update system.

## About the Exercise
This project is developed with the following stack:
- **Backend:** Phoenix (Elixir) + PostgreSQL  
- **Frontend:** React + TypeScript

## Good to Know
I have experience with similar technologies (Ruby on Rails, Vue.js), but this was my first time working with these specific languages. Strong typing with TypeScript was the biggest novelty for me. I utilized ChatGPT for documentation, writing tests, and some final refactoring tasks.

## Technical Choices

### 1. Basic Functionality
For implementing Drag and Drop functionality, I chose the [Dnd-kit library](https://github.com/clauderic/dnd-kit) (13.6k ⭐️, last release: 1 month ago). This library is smooth to implement and well-documented.

### 2. Real-time Collaboration
I used WebSocket for real-time features. Since Phoenix natively integrates the Channel module, it felt natural to use it. Additionally, it shares similarities with channels in the Ruby on Rails framework, with which I am familiar.

### 3. Performance Optimization, Customization, & Extensibility
- **Infinite Scroll & Dynamic Columns:** For pagination, I implemented an infinite scroll per column inspired by Trello. This feature was developed alongside dynamic column creation, as it logically complemented this functionality. As a result, I reversed these two requirements.
  
- **Query Optimization:** To optimize queries, I used `update_all`. However, due to the `candidates_job_id_position_column_id_index` index, a direct operation wasn't feasible. I employed an intermediate update with an offset to free up all positions to be updated, followed by a bulk update to assign final positions.

- **Candidate View:** You can access to the candidate view on the following path /jobs/:job_id/candidates/:candidate_id

### 4. Future Enhancements
- **Dynamic Column Management:**
  - Positioning with Drag and Drop
  - Edit form UI improvements
  - Delete column confirmation warning

- **Real-time Features:**
  - Toast notifications and highlights on candidate updates
  - Column update management

## Git Branch Architecture (Needs Improvement)
- `feature/drag_n_drop`
- `feature/job_channels`
- `feature/dynamic_columns_and_pagination`
- `feature/full_test_refactoring`
- `tweak/improve_candidate_service_queries`

All these branches are merged into the `feature/full_test` branch.

A final pull request with all changes is available [here](https://github.com/Mesnet/wttj_kanban/pull/2).

If I were to redo this exercise, I would open one pull request per feature with more concise code to simplify the review process.

## Requirements
- Elixir 1.17.2-otp-27
- Erlang 27.0.1
- PostgreSQL
- Node.js 20.11.0
- Yarn

## Getting Started

To start the Phoenix server:

1. Checkout the `feature/full_test` branch:
   ```bash
   git checkout feature/full_test
   ```

2. Install and set up dependencies:
   ```bash
   mix setup
   ```

3. Start the Phoenix endpoint:
   ```bash
   mix phx.server
   # or inside IEx
   iex -S mix phx.server
   ```

4. Install frontend assets and start the development server:
   ```bash
   cd assets
   yarn
   yarn dev
   ```

### Running Tests
- **Backend:**
  ```bash
  mix test
  ```
- **Frontend:**
  ```bash
  cd assets && yarn test
  ```

Now, you can access the application at [http://localhost:4000](http://localhost:4000).

