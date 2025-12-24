import { Request, Response } from "express";
import ClassModel from "../models/Class";

export async function createClass(req: Request, res: Response) {
  const { name, level, arm } = req.body;
  if (!name || !level) return res.status(400).json({ message: "name & level required" });
  const c = await ClassModel.create({ name, level, arm });
  res.json(c);
}

export async function listClasses(req: Request, res: Response) {
  const classes = await ClassModel.find().lean();
  res.json(classes);
}