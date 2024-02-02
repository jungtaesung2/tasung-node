import express from "express";
import { prisma } from "../models/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 이력서 생성 API
router.post("/resumes", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const { status, title, intro, exp, skill } = req.body;
  const userInfos = await prisma.userInfos.findFirst({
    where: {userId: +userId,},
    select: {userInfoId: true,},
  });
  const userInfoId = userInfos?.userInfoId;
  const resume = await prisma.resumes.create({
    data: {
      userId: +userId,
      userInfoId: +userInfoId,
      status,
      title,
      intro,
      exp,
      skill,
    },
  });

  return res.status(201).json({ data: resume });
});

// 이력서 목록 조회 API 
router.get("/resumes", async (req, res, next) => {
    const resumes = await prisma.resumes.findMany({
        select: {
          resumeId: true,
          userId: true,
          userInfoId: true,
          status: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          userInfos: {
            select: {
              profileImage: true,
              name: true,
            },
          },
        },
      });

  return res.status(200).json({ data: resumes });
});

// 이력서 상세조회 API
router.get("/resumes/:resumeId", async (req, res, next) => {
  const { resumeId } = req.params;
  const resume = await prisma.resumes.findFirst({
    where: {
      resumeId: +resumeId,
    },
    select: {
      resumeId: true,
      userId: true,
      userInfoId: true,
      status: true,
      title: true,
      userInfos: {
        select: {
          name: true,
          age: true,
          gender: true,
          profileImage: true,
        },
      },
      intro: true,
      exp: true,
      skill: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: resume });
});

// 이력서 수정 API
router.patch("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  const { resumeId } = req.params;
  const { userId } = req.user;
  const { status, title, intro, exp, skill } = req.body;

  const resume = await prisma.resumes.findFirst({
    where: {
      resumeId: +resumeId,
      userId: +userId,
    },
  });

  if (!resume) {
    return res.status(404).json({ error: "이력서를 찾을 수 없습니다." });
  }

  const updatedResume = await prisma.resumes.update({
    where: {
      resumeId: +resumeId,
    },
    data: {
      status,
      title,
      intro,
      exp,
      skill,
    },
  });

  return res.status(200).json({ data: updatedResume });
});

// 이력서 삭제 API
router.delete("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  const { resumeId } = req.params;
  const { userId } = req.user;

  const resume = await prisma.resumes.findFirst({
    where: {
      resumeId: +resumeId,
      userId: +userId,
    },
  });

  if (!resume) {
    return res.status(404).json({ error: "이력서를 찾을 수 없습니다." });
  }

  await prisma.resumes.delete({
    where: {
      resumeId: +resumeId,
    },
  });

  return res.status(200).json({ message: "이력서가 삭제되었습니다." });
});

export default router;