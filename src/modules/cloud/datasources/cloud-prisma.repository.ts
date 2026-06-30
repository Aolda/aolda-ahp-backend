import type { PrismaClient } from '@prisma/client';

import {
  BriefResponse,
  CloudRepository,
  FaqListResponse,
  NoticeDetailResponse,
  NoticeListResponse,
  ProductDetailResponse,
  ProductListResponse,
  UseProjectResponse,
} from '../repositories/cloud.repository';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const USER_COUNT_KEY = 'userCount';
const PROJECT_COUNT_KEY = 'projectCount';

export class CloudPrismaRepository implements CloudRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getBrief(): Promise<BriefResponse> {
    const metrics = await this.prisma.cloudBriefMetric.findMany({
      where: { key: { in: [USER_COUNT_KEY, PROJECT_COUNT_KEY] } },
    });
    const metricMap = new Map(metrics.map((metric) => [metric.key, metric]));

    return {
      userCount: this.toMetricValue(metricMap.get(USER_COUNT_KEY), '명'),
      projectCount: this.toMetricValue(metricMap.get(PROJECT_COUNT_KEY), '개'),
    };
  }

  async getUseProjectList(): Promise<UseProjectResponse> {
    const projects = await this.prisma.cloudUseProject.findMany({
      where: { isVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      total: projects.length,
      data: projects.map((project) => ({
        teamName: project.teamName,
        description: project.description ?? '',
        ...(this.toDuration(project)
          ? { duration: this.toDuration(project) }
          : {}),
        projectImage: { url: project.projectImageUrl ?? '' },
      })),
    };
  }

  async getFaqList(): Promise<FaqListResponse> {
    const [categories, faqs, total] = await Promise.all([
      this.prisma.cloudFaqCategory.findMany({
        where: { isVisible: true },
        orderBy: [{ sortOrder: 'asc' }, { categoryTitle: 'asc' }],
      }),
      this.prisma.cloudFaq.findMany({
        where: { isVisible: true, category: { isVisible: true } },
        orderBy: [{ sortOrder: 'asc' }, { publicId: 'asc' }],
        take: DEFAULT_PAGE_SIZE,
      }),
      this.prisma.cloudFaq.count({
        where: { isVisible: true, category: { isVisible: true } },
      }),
    ]);

    return {
      categories: Object.fromEntries(
        categories.map((category) => [
          category.code,
          {
            categoryImg: { url: category.categoryImageUrl ?? '' },
            categoryTitle: category.categoryTitle,
          },
        ]),
      ),
      questions: {
        paginate: this.toPagination(total),
        total,
        data: faqs.map((faq) => ({
          faqId: faq.publicId,
          faqTitle: faq.faqTitle,
          faqAnswer: faq.faqAnswer,
        })),
      },
    };
  }

  async getNoticeList(): Promise<NoticeListResponse> {
    const [notices, total] = await Promise.all([
      this.prisma.cloudNotice.findMany({
        where: { isVisible: true },
        orderBy: [{ createdAt: 'desc' }, { publicId: 'desc' }],
        take: DEFAULT_PAGE_SIZE,
      }),
      this.prisma.cloudNotice.count({ where: { isVisible: true } }),
    ]);

    return {
      paginate: this.toPagination(total),
      total,
      data: notices.map((notice) => ({
        noticeId: notice.publicId,
        noticeType: notice.noticeType,
        noticeTitle: notice.noticeTitle,
        createdAt: this.formatDateTime(notice.createdAt),
      })),
    };
  }

  async getNoticeDetail(noticeId: string): Promise<NoticeDetailResponse> {
    const publicId = this.parsePublicId(noticeId, 'notice');
    const notice = await this.prisma.cloudNotice.findFirst({
      where: { publicId, isVisible: true },
      include: {
        attachments: { orderBy: [{ sortOrder: 'asc' }, { publicId: 'asc' }] },
      },
    });

    if (!notice) {
      throw new Error(`Notice not found: ${noticeId}`);
    }

    const [prev, next] = await Promise.all([
      this.prisma.cloudNotice.findFirst({
        where: { isVisible: true, publicId: { lt: publicId } },
        orderBy: { publicId: 'desc' },
        select: { publicId: true },
      }),
      this.prisma.cloudNotice.findFirst({
        where: { isVisible: true, publicId: { gt: publicId } },
        orderBy: { publicId: 'asc' },
        select: { publicId: true },
      }),
    ]);

    return {
      data: {
        noticeId: notice.publicId,
        noticeType: notice.noticeType,
        noticeTitle: notice.noticeTitle,
        createdAt: this.formatDateTime(notice.createdAt),
        createdBy: {
          userId: notice.authorId ?? 0,
          userName: notice.authorName ?? '',
        },
        readCount: notice.readCount,
        attatchments: notice.attachments.map((attachment) => ({
          attatchmentId: attachment.publicId,
          file: { url: attachment.fileUrl },
        })),
        content: notice.content,
      },
      neighbors: {
        prev: prev?.publicId ?? 0,
        next: next?.publicId ?? 0,
      },
    };
  }

  async getProductList(): Promise<ProductListResponse> {
    const categories = await this.prisma.cloudProductCategory.findMany({
      where: { isVisible: true },
      include: {
        products: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { publicId: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { categoryTitle: 'asc' }],
    });

    return {
      categories: Object.fromEntries(
        categories.map((category) => [
          category.code,
          {
            categoryImg: { url: category.categoryImageUrl ?? '' },
            categoryTitle: category.categoryTitle,
          },
        ]),
      ),
      products: Object.fromEntries(
        categories.map((category) => [
          category.code,
          category.products.map((product) => ({
            productId: product.publicId,
            productIcon: { url: product.productIconUrl ?? '' },
            productName: product.productName,
            description: product.description,
          })),
        ]),
      ),
    };
  }

  async getProductDetail(productId: string, requestOrigin: string): Promise<ProductDetailResponse> {
    const publicId = this.parsePublicId(productId, 'product');
    const product = await this.prisma.cloudProduct.findFirst({
      where: { publicId, isVisible: true, category: { isVisible: true } },
      include: {
        participants: { orderBy: [{ sortOrder: 'asc' }, { crewName: 'asc' }] },
        relatedServices: { orderBy: [{ sortOrder: 'asc' }, { pageTitle: 'asc' }] },
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    return {
      productId: product.publicId,
      productIcon: { url: product.productIconUrl ?? '' },
      productName: product.productName,
      description: product.description,
      cloudLink: product.cloudLink ?? '',
      projectLink: product.projectSourceId
        ? `${requestOrigin.replace(/\/$/, '')}/team/project/${product.projectSourceId}`
        : '',
      content: product.content,
      participants: product.participants.map((participant) => ({
        crewId: participant.crewPublicId ?? participant.crewSourceId ?? 0,
        profile: { url: participant.profileUrl ?? '' },
        crewName: participant.crewName,
        univDepartment: participant.univDepartment ?? '',
        univJoinedYear: participant.univJoinedYear ?? '',
      })),
      relateServices: product.relatedServices.map((service) => ({
        pageTitle: service.pageTitle,
        thumbnailImg: { url: service.thumbnailUrl ?? '' },
        serviceLink: service.serviceLink ?? '',
      })),
    };
  }

  private toMetricValue(metric: { value: number; unit: string } | undefined, fallbackUnit: string) {
    return {
      value: metric?.value ?? 0,
      unit: metric?.unit ?? fallbackUnit,
    };
  }

  private toDuration(project: {
    durationFromYear: number | null;
    durationFromSemester: number | null;
    durationToYear: number | null;
    durationToSemester: number | null;
  }): UseProjectResponse['data'][number]['duration'] | undefined {
    const from =
      project.durationFromYear && project.durationFromSemester
        ? { year: project.durationFromYear, semester: project.durationFromSemester }
        : undefined;
    const to =
      project.durationToYear && project.durationToSemester
        ? { year: project.durationToYear, semester: project.durationToSemester }
        : undefined;

    return from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : undefined;
  }

  private toPagination(total: number) {
    return {
      from: total > 0 ? 1 : 0,
      to: Math.min(total, DEFAULT_PAGE_SIZE),
      curr: DEFAULT_PAGE,
    };
  }

  private parsePublicId(value: string, label: string): number {
    const publicId = Number(value);
    if (!Number.isInteger(publicId) || publicId <= 0) {
      throw new Error(`Invalid ${label} id: ${value}`);
    }

    return publicId;
  }

  private formatDateTime(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');

    return [
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    ].join(' ');
  }
}
