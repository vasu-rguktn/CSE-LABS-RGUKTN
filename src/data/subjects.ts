export interface Subject {
  id: string;
  name: string;
  shortName: string;
  code: string;
}

export const subjects: Subject[] = [
  {
    id: "pstc-lab",
    name: "Problem Solving and Programming Through C Lab",
    shortName: "PSTC Lab",
    code: "23CS1181",
  },
  {
    id: "daa-lab",
    name: "Design and Analysis of Algorithms Lab",
    shortName: "DAA Lab",
    code: "23CS2181",
  },
  {
    id: "dbms-lab",
    name: "Database Management Systems Lab",
    shortName: "DBMS Lab",
    code: "23CS2182",
  },
  {
    id: "cn-lab",
    name: "Computer Networks Lab",
    shortName: "CN Lab",
    code: "23CS3182",
  },
  {
    id: "os-lab",
    name: "Operating Systems Lab",
    shortName: "OS Lab",
    code: "23CS3181",
  },
  {
    id: "se-lab",
    name: "Software Engineering Lab",
    shortName: "SE Lab",
    code: "23CS3183",
  },
  {
    id: "bpl-lab",
    name: "Basic Programming Language Lab",
    shortName: "BPL Lab",
    code: "23CS1188",
  },
  {
    id: "pds-lab",
    name: "Programming and Data Structures Lab",
    shortName: "PDS Lab",
    code: "23CSXXXX",
  },
  {
    id: "oops-lab",
    name: "Object Oriented Programming Lab",
    shortName: "OOPS Lab",
    code: "23CSXXXX",
  },
];
