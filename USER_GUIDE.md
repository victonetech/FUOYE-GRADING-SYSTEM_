# FUOYE Grading System — User Guide

Welcome to the **FUOYE Grading System**, a professional, data-centric application designed for efficient academic management. This guide will walk you through the system's features, from initial setup to final grade reporting.

---

## 1. Getting Started

### The Dashboard
Upon logging in, you are greeted by the **Dashboard**, which provides a high-level overview of the university's academic state.
- **Quick Stats**: Instantly see the total number of Faculties, Departments, Courses, and Students.
- **Grading Progress**: Track how many students have been graded and how many are still pending.
- **Alerts**: The system automatically flags failing grades for immediate review.
- **Quick Actions**: Shortcuts to add new entities (Faculty, Department, Student) or jump straight to Grade Entry.

### The Sidebar (Global Controls)
The navy sidebar on the left is your primary navigation tool.
- **Academic Session & Semester**: **Crucial!** Before performing any operation, ensure you have selected the correct **Academic Session** (e.g., 2024/2025) and **Semester** (1st or 2nd) at the bottom of the sidebar. The entire system filters data based on these selections.
- **Department Quick Access**: Links at the bottom of the sidebar allow you to jump directly to a specific department's student list.

---

## 2. Academic Setup

### Managing Faculties & Departments
1.  Navigate to **Faculties** or **Departments** via the sidebar.
2.  **Add**: Click the "Add" button to create a new entry.
3.  **Edit**: Use the pencil icon to update names or codes.
4.  **Delete**: Use the trash icon. *Note: The system prevents deletion if there are dependent records (e.g., you cannot delete a Faculty that still has Departments).*

### Managing Courses
Courses are session-specific.
1.  Select the correct **Session** and **Semester** in the sidebar.
2.  Navigate to **Courses**.
3.  Click **Add Course** and fill in the Code, Title, Department, Level, Semester, and Credit Units.
4.  **Search**: Use the search bar to quickly find courses by code or title.

### Managing Students
Students are managed by Academic Session.
1.  Navigate to **Students**.
2.  **Manual Entry**: Click "Add Student" for individual entries.
3.  **Bulk Import**: Click "Import CSV/Excel" to upload a list of students. Use the provided template to ensure the format matches (`Matric No`, `Name`, `Department`, `Level`, `Email`).
4.  **Filter**: The student list can be filtered by Department using the sidebar links.

---

## 3. Grade Entry & Processing

The **Grade Entry** page is the core of the system.

### Manual Entry
1.  Select the **Department** and **Course**.
2.  The system will load the list of students eligible for that course based on their Level and Department.
3.  Click on any cell under **CA1**, **CA2**, or **Exam** to enter a score.
4.  Press **Enter** to save the score.

### Bulk Grade Import
To save time, you can import scores from a spreadsheet:
1.  Click **Download Template** to get a CSV file in the correct format.
2.  Fill in the scores in your spreadsheet software.
3.  Click **Import CSV/Excel** and upload your file.
4.  Review the **Import Preview** to ensure all matriculation numbers match before confirming.

### Automated Grading Logic
The system automatically calculates results as you enter data:
- **Rounding**: Scores of 29, 39, 59, 69, 79, and 89 are automatically rounded up (e.g., 39 becomes 40) to assist students at grade boundaries.
- **Total CA**: `CA1 + CA2` (capped at 30).
- **Total Score**: `Total CA + Exam`.
- **Grade Assignment**:
  - **70+**: A (Excellent)
  - **60-69**: B (Very Good)
  - **50-59**: C (Good)
  - **45-49**: D (Pass)
  - **40-44**: E (Pass)
  - **0-39**: F (Fail)

---

## 4. Reports & Exporting

### Generating Reports
1.  Navigate to **Reports**.
2.  Select a **Department** and **Course**.
3.  **Summary Statistics**: View the pass/fail distribution and total student count for the selected course.
4.  **Grade Distribution**: A visual breakdown showing the percentage of students who achieved each grade (A-F).

### Exporting Data
- **Export to Excel**: Generates a professional spreadsheet containing Student IDs, Names, Levels, Total CA, Exam scores, Final Totals, Grades, and Remarks.
- **Printing**: Use the **Print** button on the Grade Entry page to generate a formatted physical report for official university records.

---

## 5. Technical Notes
- **Offline Capability**: The system stores all data locally in your browser. No internet connection is required for daily operations after the initial load.
- **Data Safety**: Since data is stored in the browser, clearing your browser's "Site Data" or "Cache" may delete your records. It is recommended to regularly **Export to Excel** to keep external backups of your data.
