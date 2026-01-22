# Project Time Table Management System  
### Database Management Systems Project

---

## 1. Introduction

The **Project Time Table Management System** is a database-oriented project designed to model and manage the complete scheduling workflow of academic projects in an educational institution. It focuses on organizing project-related activities such as group formation, guide allocation, review scheduling, room and time slot assignment, project submissions, evaluation tracking, and notifications.

The system captures real-world constraints and helps in managing project sessions such as guide meetings, reviews, demos, and presentations in a structured and conflict-free manner.

The project emphasizes **conceptual database design**, **entity–relationship modeling**, and **schema normalization** as per DBMS standards.

---

## 2. Objectives

- To design a **structured relational database** for project timetable scheduling  
- To apply **Entity–Relationship (ER) modeling** techniques  
- To reduce redundancy by applying **normalization up to 3NF**  
- To enforce real-world constraints using keys and relationships  
- To support scalability for multiple departments, semesters, and academic years  

---

## 3. Scope of the System

The system covers the following functional areas:

- Student and faculty information management  
- Project registration and details storage  
- Group formation and student grouping  
- Guide allocation to groups/projects  
- Scheduling review sessions, demos, and presentations  
- Room and time slot management  
- Submission tracking (PPT, report, code, etc.)  
- Evaluation and marks entry for reviews  
- Notification system for deadlines and timetable updates  

---

## 4. Entity Description

### 4.1 Student  
Stores student details such as roll number, department, academic year, contact details, etc.

### 4.2 Faculty  
Represents faculty members who can be assigned as project guides or evaluators.

### 4.3 Project  
Maintains information about projects such as project title, domain, semester, and project status.

### 4.4 Project Group  
Represents project groups formed by students. Each group is associated with a project and a guide.

### 4.5 Group Member  
Acts as a relationship entity linking students with groups and defining roles like leader/member.

### 4.6 Room  
Stores information about labs/classrooms used for project sessions, including capacity.

### 4.7 Time Slot  
Defines timetable slots for scheduling sessions based on day and time interval.

### 4.8 Session  
Represents scheduled activities such as review meeting, demo, presentation, or guide meeting.  
It connects **group + faculty + room + time slot**.

### 4.9 Review  
Stores review evaluation information such as review number, marks, and remarks, linked to a session.

### 4.10 Submission  
Tracks deliverables submitted by groups like reports, PPTs, code files, etc.

### 4.11 Notification  
Stores notices sent to students/faculty for session updates, deadlines, and announcements.

---

## 5. Relationships Overview

- One **Faculty** can guide multiple **Project Groups**
- One **Project** is linked to one **Project Group**
- One **Project Group** contains multiple **Students** via **Group Member**
- One **Room** can host multiple **Sessions**
- One **Time Slot** can be assigned to multiple **Sessions**
- One **Project Group** can have multiple **Sessions**
- One **Session** may generate one **Review**
- One **Project Group** can submit multiple **Submissions**
- Notifications can be sent for multiple events like sessions, reviews, or deadlines

---

## 6. Constraints and Assumptions

- A student can belong to **only one active project group** in a semester  
- A faculty member can guide multiple groups but session clashes must be avoided  
- A room cannot have multiple sessions in the same time slot  
- Project sessions must not overlap for the same group  
- Review history is preserved using session date, status, and review number  
- Submissions can be updated with status (submitted/late/rejected/approved)

---

## 7. ER Diagram

The Entity–Relationship diagram visually represents all entities, attributes, primary keys, foreign keys, and relationships used in the system.

*(ER diagram designed using MySQL Workbench)*

---

## 8. Authors  
**RUDRANSH SHARMA 23BCS093**  
**SABHYA DHIMAN 23BCS094**  
**SACHIN CHAUDHARY 23BCS095**  
**SAHIL TEKTA 23BCS096**

