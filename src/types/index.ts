export interface Classroom {
  id: string;
  name: string;
  capacity: number;
}

export interface Professor {
  id: string;
  name: string;
  email: string;
  department: string;
  hoursPerWeek: number;
}

export interface ClassSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  classroomId: string;
  professorId: string;
  subject: string;
}
