export interface Subject {
  id: string;
  name: string;
  shortName: string;
  code: string;
  year: string;
  semester: string;
  credits: number;
  type: string;
}

export const subjects: Subject[] = [
  { id: "23EE1109", code: "23EE1109", name: "Basic Electrical and Electronics Engg.", shortName: "BEEE", year: "E1", semester: "S1", credits: 4, type: "Theory" },
  { id: "23EC1189", code: "23EC1189", name: "Basic Electrical and Electronics Engg. Lab", shortName: "BEEE Lab", year: "E1", semester: "S1", credits: 1, type: "Lab" },
  { id: "23MA1102", code: "23MA1102", name: "Calculus & Linear Algebra", shortName: "CLA", year: "E1", semester: "S1", credits: 4, type: "Theory" },
  { id: "23ME1214", code: "23ME1214", name: "Engineering Graphics and Computer Drafting", shortName: "EGCD", year: "E1", semester: "S1", credits: 2, type: "Lab" },
  { id: "23EG1181", code: "23EG1181", name: "English Lab-I", shortName: "Eng Lab-I", year: "E1", semester: "S1", credits: 2, type: "Lab" },
  { id: "23HS1101", code: "23HS1101", name: "Indian Constitution", shortName: "IC", year: "E1", semester: "S1", credits: 0, type: "Theory" },
  { id: "23CS1101", code: "23CS1101", name: "Problem Solving and Programming Through C", shortName: "PSTC", year: "E1", semester: "S1", credits: 4, type: "Theory" },
  { id: "23CS1181", code: "23CS1181", name: "Problem Solving and Programming Through C Lab", shortName: "PSTC Lab", year: "E1", semester: "S1", credits: 1, type: "Lab" },
  { id: "23CS1202", code: "23CS1202", name: "Data Structures", shortName: "DS", year: "E1", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS1282", code: "23CS1282", name: "Data Structures Lab", shortName: "DS Lab", year: "E1", semester: "S2", credits: 1, type: "Lab" },
  { id: "23MA1202", code: "23MA1202", name: "Discrete Mathematics", shortName: "DM", year: "E1", semester: "S2", credits: 4, type: "Theory" },
  { id: "23PY1201", code: "23PY1201", name: "Engineering Physics", shortName: "EP", year: "E1", semester: "S2", credits: 4, type: "Theory" },
  { id: "23PY1281", code: "23PY1281", name: "Engineering Physics Lab", shortName: "EP Lab", year: "E1", semester: "S2", credits: 1, type: "Lab" },
  { id: "23BE1201", code: "23BE1201", name: "Environmental Science", shortName: "EVS", year: "E1", semester: "S2", credits: 0, type: "Theory" },
  { id: "23BM1201", code: "23BM1201", name: "Managerial Economics and Finance Analysis", shortName: "MEFA", year: "E1", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS1201", code: "23CS1201", name: "Object Oriented Programming through Java", shortName: "OOPJ", year: "E1", semester: "S2", credits: 4, type: "Theory" },
  { id: "23CS1281", code: "23CS1281", name: "Object Oriented Programming through Java Lab", shortName: "OOPJ Lab", year: "E1", semester: "S2", credits: 1, type: "Lab" },
  { id: "23CS2102", code: "23CS2102", name: "Database Management Systems", shortName: "DBMS", year: "E2", semester: "S1", credits: 3, type: "Theory" },
  { id: "23CS2182", code: "23CS2182", name: "Database Management Systems Lab", shortName: "DBMS Lab", year: "E2", semester: "S1", credits: 1, type: "Lab" },
  { id: "23CS2101", code: "23CS2101", name: "Design & Analysis of Algorithms", shortName: "DAA", year: "E2", semester: "S1", credits: 4, type: "Theory" },
  { id: "23CS2181", code: "23CS2181", name: "Design & Analysis of Algorithms Lab", shortName: "DAA Lab", year: "E2", semester: "S1", credits: 1, type: "Lab" },
  { id: "23EC2109", code: "23EC2109", name: "Digital Logic Design", shortName: "DLD", year: "E2", semester: "S1", credits: 3, type: "Theory" },
  { id: "23EC2189", code: "23EC2189", name: "Digital Logic Design Lab", shortName: "DLD Lab", year: "E2", semester: "S1", credits: 1, type: "Lab" },
  { id: "23CS2103", code: "23CS2103", name: "Formal Languages & Automata Theory", shortName: "FLAT", year: "E2", semester: "S1", credits: 3, type: "Theory" },
  { id: "23MA2102", code: "23MA2102", name: "Probability and Statistics", shortName: "P&S", year: "E2", semester: "S1", credits: 4, type: "Theory" },
  { id: "23CS2204", code: "23CS2204", name: "Compiler Design", shortName: "CD", year: "E2", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS2201", code: "23CS2201", name: "Computer Organization & Architecture", shortName: "COA", year: "E2", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS2281", code: "23CS2281", name: "Computer Organization & Architecture Lab", shortName: "COA Lab", year: "E2", semester: "S2", credits: 1, type: "Lab" },
  { id: "23CS2202", code: "23CS2202", name: "Data Science with Python", shortName: "DSP", year: "E2", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS2282", code: "23CS2282", name: "Data Science with Python Lab", shortName: "DSP Lab", year: "E2", semester: "S2", credits: 1, type: "Lab" },
  { id: "23BM2202", code: "23BM2202", name: "Introduction to Operational Research", shortName: "OR", year: "E2", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS2203", code: "23CS2203", name: "Web Technologies", shortName: "WT", year: "E2", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS2283", code: "23CS2283", name: "Web Technologies Lab", shortName: "WT Lab", year: "E2", semester: "S2", credits: 1, type: "Lab" },
  { id: "23CS3104", code: "23CS3104", name: "Artificial Intelligence", shortName: "AI", year: "E3", semester: "S1", credits: 4, type: "Theory" },
  { id: "23CS3102", code: "23CS3102", name: "Computer Networks", shortName: "CN", year: "E3", semester: "S1", credits: 3, type: "Theory" },
  { id: "23CS3182", code: "23CS3182", name: "Computer Networks Lab", shortName: "CN Lab", year: "E3", semester: "S1", credits: 1, type: "Lab" },
  { id: "23CS31XX", code: "23CS31XX", name: "Elective-I", shortName: "Elec-I", year: "E3", semester: "S1", credits: 3, type: "Theory" },
  { id: "23EG3182", code: "23EG3182", name: "English Lab-II", shortName: "Eng Lab-II", year: "E3", semester: "S1", credits: 1, type: "Lab" },
  { id: "23CS3101", code: "23CS3101", name: "Operating Systems", shortName: "OS", year: "E3", semester: "S1", credits: 3, type: "Theory" },
  { id: "23CS3181", code: "23CS3181", name: "Operating Systems Lab", shortName: "OS Lab", year: "E3", semester: "S1", credits: 1, type: "Lab" },
  { id: "23CS3103", code: "23CS3103", name: "Software Engineering", shortName: "SE", year: "E3", semester: "S1", credits: 3, type: "Theory" },
  { id: "23CS3183", code: "23CS3183", name: "Software Engineering Lab", shortName: "SE Lab", year: "E3", semester: "S1", credits: 1, type: "Lab" },
  { id: "23CS3203", code: "23CS3203", name: "Career Development Course", shortName: "CDC", year: "E3", semester: "S2", credits: 0, type: "Theory" },
  { id: "23CS3201", code: "23CS3201", name: "Cryptography and Network Security", shortName: "CNS", year: "E3", semester: "S2", credits: 4, type: "Theory" },
  { id: "23CS32XX", code: "23CS32XX", name: "Elective-III", shortName: "Elec-III", year: "E3", semester: "S2", credits: 3, type: "Theory" },
  { id: "23EG3283", code: "23EG3283", name: "English Lab-III", shortName: "Eng Lab-III", year: "E3", semester: "S2", credits: 1, type: "Lab" },
  { id: "23CS3202", code: "23CS3202", name: "Machine Learning", shortName: "ML", year: "E3", semester: "S2", credits: 4, type: "Theory" },
  { id: "23CS3291", code: "23CS3291", name: "Mini Project", shortName: "Mini Proj", year: "E3", semester: "S2", credits: 3, type: "Lab" },
  { id: "23XX32XX", code: "23XX32XX", name: "Open Elective-I", shortName: "OE-I", year: "E3", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS3292", code: "23CS3292", name: "Summer Internship", shortName: "Internship", year: "E3", semester: "Summer", credits: 3, type: "Lab" },
  { id: "23CS41XX", code: "23CS41XX", name: "Elective-V", shortName: "Elec-V", year: "E4", semester: "S1", credits: 3, type: "Theory" },
  { id: "23XX41XX", code: "23XX41XX", name: "Open Elective-II", shortName: "OE-II", year: "E4", semester: "S1", credits: 3, type: "Theory" },
  { id: "23CS4193", code: "23CS4193", name: "Project-I", shortName: "Proj-I", year: "E4", semester: "S1", credits: 6, type: "Lab" },
  { id: "23CS4299", code: "23CS4299", name: "Community Service", shortName: "CS", year: "E4", semester: "S2", credits: 2, type: "Lab" },
  { id: "23CS42XX", code: "23CS42XX", name: "Elective-VI", shortName: "Elec-VI", year: "E4", semester: "S2", credits: 3, type: "Theory" },
  { id: "23XX42XX", code: "23XX42XX", name: "Open Elective-IV", shortName: "OE-IV", year: "E4", semester: "S2", credits: 3, type: "Theory" },
  { id: "23CS4294", code: "23CS4294", name: "Project-II", shortName: "Proj-II", year: "E4", semester: "S2", credits: 6, type: "Lab" }
];
