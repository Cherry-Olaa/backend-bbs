import { Request, Response } from "express";
import Subject from "../models/Subject";

export async function createSubject(req: Request, res: Response) {
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).json({ message: "code & name required" });
  const s = await Subject.create({ code: code.toUpperCase(), name });
  res.json(s);
}

export async function listSubjects(req: Request, res: Response) {
  const subjects = await Subject.find().lean();
  res.json(subjects);
}