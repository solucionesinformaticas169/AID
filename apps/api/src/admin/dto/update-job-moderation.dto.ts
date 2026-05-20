import { IsEnum } from "class-validator";

export const JOB_MODERATION_ACTIONS = {
  APPROVE: "APPROVE",
  REQUEST_CHANGES: "REQUEST_CHANGES",
} as const;

export type JobModerationAction =
  (typeof JOB_MODERATION_ACTIONS)[keyof typeof JOB_MODERATION_ACTIONS];

export class UpdateJobModerationDto {
  @IsEnum(JOB_MODERATION_ACTIONS)
  action!: JobModerationAction;
}
