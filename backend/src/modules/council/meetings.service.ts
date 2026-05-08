import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { WorkflowService } from '../../workflow/workflow.service';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly workflow: WorkflowService,
  ) {}

  async list(query: { councilId?: string; from?: string; to?: string }) {
    return this.prisma.meeting.findMany({
      where: {
        councilId: query.councilId,
        scheduledAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      include: {
        attendees: true,
        _count: { select: { decisions: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async get(id: string) {
    const m = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: true,
        decisions: { include: { votes: true } },
        attachments: true,
        workflowInstance: { include: { steps: true } },
      },
    });
    if (!m) throw new NotFoundException({ messageAr: 'الاجتماع غير موجود' });
    return m;
  }

  async schedule(data: {
    councilId?: string;
    departmentId?: string;
    titleAr: string;
    agenda: any;
    scheduledAt: string;
    location?: string;
    attendees?: { userId?: string; externalName?: string }[];
  }) {
    return this.prisma.meeting.create({
      data: {
        councilId: data.councilId,
        departmentId: data.departmentId,
        titleAr: data.titleAr,
        agenda: data.agenda,
        scheduledAt: new Date(data.scheduledAt),
        location: data.location,
        attendees: data.attendees
          ? {
              create: data.attendees.map((a) => ({
                userId: a.userId,
                externalName: a.externalName,
              })),
            }
          : undefined,
      },
      include: { attendees: true },
    });
  }

  async addDecision(meetingId: string, data: {
    number: string;
    topic: string;
    description: string;
    dueDate?: string;
    ownerId?: string;
  }) {
    return this.prisma.decision.create({
      data: {
        meetingId,
        number: data.number,
        topic: data.topic,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        ownerId: data.ownerId,
      },
    });
  }

  async castVote(decisionId: string, voterId: string, vote: 'APPROVE' | 'REJECT' | 'ABSTAIN', reason?: string) {
    const v = await this.prisma.vote.upsert({
      where: { decisionId_voterId: { decisionId, voterId } },
      create: { decisionId, voterId, vote, reason },
      update: { vote, reason },
    });

    const counts = await this.prisma.vote.groupBy({
      by: ['vote'],
      where: { decisionId },
      _count: { vote: true },
    });

    const ap = counts.find((c) => c.vote === 'APPROVE')?._count.vote ?? 0;
    const rj = counts.find((c) => c.vote === 'REJECT')?._count.vote ?? 0;
    const ab = counts.find((c) => c.vote === 'ABSTAIN')?._count.vote ?? 0;

    let voteResult: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    if (ap > rj && ap >= 2) voteResult = 'APPROVED';
    if (rj >= ap && rj >= 2) voteResult = 'REJECTED';

    await this.prisma.decision.update({
      where: { id: decisionId },
      data: { approvedBy: ap, rejectedBy: rj, abstained: ab, vote: voteResult },
    });

    return v;
  }

  /**
   * يبدأ سير اعتماد المحضر (يحتاج توقيع العميد).
   */
  async submitMinutes(meetingId: string, submitterId: string, minutesUrl: string) {
    const tenantId = this.tenancy.getTenantId();
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException({ messageAr: 'الاجتماع غير موجود' });
    if (meeting.workflowInstanceId) {
      throw new BadRequestException({ messageAr: 'المحضر مرفوع للاعتماد مسبقاً' });
    }

    const flow = await this.workflow.start({
      tenantId,
      initiatedById: submitterId,
      definitionCode: 'MEETING_MINUTES',
      entityType: 'meeting',
      entityId: meetingId,
      data: {},
    });

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        minutesUrl,
        status: 'COMPLETED',
        endedAt: new Date(),
        workflowInstanceId: flow.id,
      },
    });
  }
}
