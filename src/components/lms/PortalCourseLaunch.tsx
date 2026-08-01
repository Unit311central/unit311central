"use client";

import { useRouter } from "next/navigation";

import CoursePlayer from "@/components/lms/CoursePlayer";

type Props = {
  courseSlug: string;
  companyPath: string;
};

export default function PortalCourseLaunch({ courseSlug, companyPath }: Props) {
  const router = useRouter();

  return (
    <CoursePlayer
      courseSlug={courseSlug}
      companyPath={companyPath}
      onClose={() => router.push(`/${companyPath}/training/assigned`)}
    />
  );
}
