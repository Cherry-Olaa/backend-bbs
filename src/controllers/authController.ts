import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import Student, { IStudent } from "../models/Student";
import { comparePassword } from "../utils/hash";
import {
    signAccess,
    signRefresh,
    verifyRefresh,
    JWTPayload,
} from "../utils/jwt";

/**
 * Student + Staff/Admin Login
 */
export async function login(req: Request, res: Response) {
    const { admissionNumber, username, password } = req.body; // -------------------- STUDENT LOGIN --------------------

    if (admissionNumber) {
        const student = (await Student.findOne({
            admissionNumber,
        })) as IStudent | null;
        if (!student)
            return res.status(401).json({ message: "Invalid credentials" });

        const valid = await comparePassword(password, student.passwordHash);
        if (!valid) return res.status(401).json({ message: "Invalid credentials" });

        const payload: JWTPayload = {
            id: student._id.toString(),
            role: "student",
            name: student.firstName,
        };

        const token = signAccess(payload);
        const refresh = signRefresh(payload);

        student.refreshToken = refresh;
        await student.save();

        return res.json({
            token,
            refresh,
            role: "student",
            id: student._id,
            name: student.firstName,
        });
    } // -------------------- STAFF / ADMIN LOGIN --------------------

    if (!username) {
        return res
            .status(400)
            .json({ message: "Missing username or admissionNumber" });
    }

    const user = (await User.findOne({ username })) as IUser | null;
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const payload: JWTPayload = {
        id: user._id.toString(),
        role: user.role as "admin" | "staff",
        name: user.fullName,
    };

    const token = signAccess(payload);
    const refresh = signRefresh(payload);

    user.refreshToken = refresh;
    await user.save();

    return res.json({
        token,
        refresh,
        role: user.role,
        id: user._id,
        name: user.fullName,
        username: user.username,
    });
}

/**
 * Refresh Token
 */
export async function refreshToken(req: Request, res: Response) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing token" });

    try {
        const payload: JWTPayload = verifyRefresh(token);

        if (payload.role === "student") {
            const student = (await Student.findById(payload.id)) as IStudent | null;
            if (!student || student.refreshToken !== token)
                return res.status(401).json({ message: "Invalid token" });

            const newPayload: JWTPayload = {
                id: student._id.toString(),
                role: "student",
                name: student.firstName,
            };

            const access = signAccess(newPayload);
            const refresh = signRefresh(newPayload);

            student.refreshToken = refresh;
            await student.save();

            return res.json({ access, refresh });
        }

        const user = (await User.findById(payload.id)) as IUser | null;
        if (!user || user.refreshToken !== token)
            return res.status(401).json({ message: "Invalid token" });

        const newPayload: JWTPayload = {
            id: user._id.toString(),
            role: user.role as "admin" | "staff",
            name: user.fullName,
        };

        const access = signAccess(newPayload);
        const refresh = signRefresh(newPayload);

        user.refreshToken = refresh;
        await user.save();

        return res.json({ access, refresh });
    } catch (err: any) {
        return res
            .status(401)
            .json({ message: "Invalid refresh token", detail: err.message });
    }
}

/**
 * Logout
 */
export async function logout(req: Request, res: Response) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing token" });

    try {
        const payload: JWTPayload = verifyRefresh(token);

        if (payload.role === "student") {
            await Student.findByIdAndUpdate(payload.id, { refreshToken: null });
        } else {
            await User.findByIdAndUpdate(payload.id, { refreshToken: null });
        }

        return res.json({ message: "Logged out" });
    } catch (err) {
        return res.status(400).json({ message: "Invalid token" });
    }
}
