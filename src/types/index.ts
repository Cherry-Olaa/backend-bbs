// types/index.ts
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    role: 'admin' | 'staff' | 'student';
    firstName: string;
    lastName: string;
    assignedClasses?: string[];
}

export interface IStudent extends Document {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    session: string;
}

export interface ISubject extends Document {
    _id: Types.ObjectId;
    name: string;
    code: string;
}

export interface ISubjectRegistration extends Document {
    studentId: Types.ObjectId | IStudent;
    subjectId: Types.ObjectId | ISubject;
    academicYear: string;
    term: 'First' | 'Second' | 'Third';
    class: string;
    isActive: boolean;
    registeredBy?: Types.ObjectId | IUser;
    registeredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IClassSubject extends Document {
    className: string;
    subjectId: Types.ObjectId | ISubject;
    isCompulsory: boolean;
    academicYear: string;
    term: 'First' | 'Second' | 'Third';
    createdAt: Date;
    updatedAt: Date;
}

export interface IResult extends Document {
    studentId: Types.ObjectId | IStudent;
    session: string;
    term: 'First' | 'Second' | 'Third';
    results: Array<{
        subjectId: Types.ObjectId | ISubject;
        ca: number;
        exam: number;
        total: number;
        grade: string;
        comment: string;
    }>;
    overallTotal: number;
    average: number;
    generatedBy?: Types.ObjectId | IUser;
    createdAt: Date;
    updatedAt: Date;
}

// Request/Response Types
export interface BulkRegistrationBody {
    class: string;
    subjectId: string;
    term: 'First' | 'Second' | 'Third';
    academicYear: string;
    studentIds: string[];
}

export interface CopyRegistrationBody {
    fromYear: string;
    fromTerm: 'First' | 'Second' | 'Third';
    toYear: string;
    toTerm: 'First' | 'Second' | 'Third';
    class: string;
}

export interface BulkResultBody {
    class: string;
    subjectId: string;
    subjectCode: string;
    term: 'First' | 'Second' | 'Third';
    academicYear: string;
    entries: Array<{
        studentId: string;
        ca: number;
        exam: number;
    }>;
}

export interface ApiResponse<T = any> {
    msg: string;
    data?: T;
    count?: number;
    message?: string;
}