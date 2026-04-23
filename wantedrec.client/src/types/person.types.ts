// ── Enums (تطابق C# Enums) ──────────────────────────────
import type { TagProps } from 'antd';
export enum Gender {
    Male = 1,
    Female = 2,
}

export const GenderLabel: Record<Gender, string> = {
    [Gender.Male]: 'ذكر',
    [Gender.Female]: 'أنثى',
};

export enum ImageSource {
    Manual = 1,
    Camera = 2,
    Import = 3,
}

export enum FaceShape { Oval = 1, Round = 2, Square = 3, Heart = 4, Long = 5 }
export enum SkinTone { Light = 1, Medium = 2, Olive = 3, Brown = 4, Dark = 5 }
export enum NoseType { Straight = 1, Hooked = 2, Wide = 3, Pointed = 4 }
export enum NoseSize { Small = 1, Medium = 2, Large = 3 }
export enum EyeShape { Almond = 1, Round = 2, Hooded = 3, Monolid = 4 }
export enum EyeSize { Small = 1, Medium = 2, Large = 3 }
export enum EyeColor { Black = 1, Brown = 2, Blue = 3, Green = 4, Hazel = 5 }
export enum EyebrowShape { Arched = 1, Straight = 2, Curved = 3 }
export enum EyebrowThickness { Thin = 1, Medium = 2, Thick = 3 }
export enum MouthShape { Wide = 1, Medium = 2, Small = 3 }
export enum LipThickness { Thin = 1, Medium = 2, Full = 3 }
export enum BeardPresence { None = 1, Light = 2, Medium = 3, Heavy = 4 }
export enum BeardStyle { Clean = 1, Stubble = 2, Short = 3, Long = 4 }
export enum MustachePresence { None = 1, Thin = 2, Thick = 3 }
export enum MustacheStyle { None = 1, Pencil = 2, Chevron = 3, Walrus = 4 }
export enum HairPresence { Bald = 1, Thin = 2, Normal = 3, Thick = 4 }
export enum HairStyle { Short = 1, Medium = 2, Long = 3, Curly = 4, Wavy = 5 }
export enum HairLength { Short = 1, Medium = 2, Long = 3 }
export enum HairColor { Black = 1, Brown = 2, Blonde = 3, Red = 4, Grey = 5, White = 6 }
export enum GlassesType { None = 1, Regular = 2, Sunglasses = 3 }
export enum HeadCoverType { None = 1, Hat = 2, Cap = 3, Hijab = 4, Turban = 5 }

// ── Security Enums (الجديدة) ────────────────────────────
export enum PersonSecurityStatus {
    Normal = 0,
    Suspect = 1,
    Wanted = 2,
    WantedAndSuspect = 3,
    Arrested = 4,
    Closed = 5,
}

export enum DangerLevel {
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

export const PersonSecurityStatusLabel: Record<PersonSecurityStatus, string> = {
    [PersonSecurityStatus.Normal]: 'طبيعي',
    [PersonSecurityStatus.Suspect]: 'مشتبه به',
    [PersonSecurityStatus.Wanted]: 'مطلوب',
    [PersonSecurityStatus.WantedAndSuspect]: 'مطلوب ومشتبه به',
    [PersonSecurityStatus.Arrested]: 'مقبوض عليه',
    [PersonSecurityStatus.Closed]: 'مغلق',
};
export const PersonSecurityStatusColor: Record<PersonSecurityStatus, TagProps['color']> = {
    [PersonSecurityStatus.Normal]: 'default',
    [PersonSecurityStatus.Suspect]: 'warning',
    [PersonSecurityStatus.Wanted]: 'error',
    [PersonSecurityStatus.WantedAndSuspect]: 'processing',
    [PersonSecurityStatus.Arrested]: 'success',
    [PersonSecurityStatus.Closed]: 'default',
};


export const DangerLevelLabel: Record<DangerLevel, string> = {
    [DangerLevel.None]: 'لا يوجد',
    [DangerLevel.Low]: 'منخفض',
    [DangerLevel.Medium]: 'متوسط',
    [DangerLevel.High]: 'عالي',
    [DangerLevel.Critical]: 'حرج',
};

export const DangerLevelColor: Record<DangerLevel, TagProps['color']> = {
    [DangerLevel.None]: 'default',
    [DangerLevel.Low]: 'success',
    [DangerLevel.Medium]: 'warning',
    [DangerLevel.High]: 'processing',
    [DangerLevel.Critical]: 'error',
};

// ── DTOs ────────────────────────────────────────────────

export interface PersonFaceImageUpsertDto {
    faceImageId?: number | null;
    cameraId?: number | null;
    imageFileName?: string | null;
    imageFilePath?: string | null;
    imageFile?: string | null;   // base64 من React
    imageSource?: ImageSource | null;
    capturedAt?: string | null;
    isActive: boolean;
    isPrimary: boolean;
    faceShape?: FaceShape | null;
    skinTone?: SkinTone | null;
    noseType?: NoseType | null;
    noseSize?: NoseSize | null;
    eyeShape?: EyeShape | null;
    eyeSize?: EyeSize | null;
    eyeColor?: EyeColor | null;
    eyebrowShape?: EyebrowShape | null;
    eyebrowThickness?: EyebrowThickness | null;
    mouthShape?: MouthShape | null;
    lipThickness?: LipThickness | null;
    beardPresence?: BeardPresence | null;
    beardStyle?: BeardStyle | null;
    mustachePresence?: MustachePresence | null;
    mustacheStyle?: MustacheStyle | null;
    hairPresence?: HairPresence | null;
    hairStyle?: HairStyle | null;
    hairLength?: HairLength | null;
    hairColor?: HairColor | null;
    glassesType?: GlassesType | null;
    headCoverType?: HeadCoverType | null;
    specialMarks?: string | null;
    descriptionNotes?: string | null;
}

export interface PersonUpsertDto {
    personId?: number | null;
    fullName: string;
    displayName?: string | null;
    gender: Gender;
    birthDate?: string | null;
    nationalId?: string | null;
    externalCode?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    notes?: string | null;
    isActive: boolean;

    // الحقول الأمنية الجديدة
    securityStatus?: PersonSecurityStatus | null;
    dangerLevel?: DangerLevel | null;
    hasActiveAlert?: boolean;
    isArmedAndDangerous?: boolean;
    securityReason?: string | null;
    caseNumber?: string | null;
    issuedBy?: string | null;
    arrestWarrantNumber?: string | null;
    alertIssuedAt?: string | null;
    alertExpiresAt?: string | null;
    lastSeenAt?: string | null;
    lastSeenLocation?: string | null;
    distinguishingMarks?: string | null;
    aliases?: string | null;
    vehicleInfo?: string | null;
    securityNotes?: string | null;
    alertInstructions?: string | null;

    faceImages?: PersonFaceImageUpsertDto[];
}

export interface SuspectSummaryDto {
    suspectId: number;
    code: string;
    riskLevel?: string;
    status?: string;
    caseReference?: string;
}

export interface PersonFaceImageDto {
    faceImageId: number;
    personId: number;
    cameraId?: number;
    imageFileName: string;
    imageFilePath: string;
    imageSource?: ImageSource;
    capturedAt?: string;
    isActive: boolean;
    isPrimary: boolean;
    embeddingDimension?: number;
    embeddingModel: string;
    embeddingVersion: string;
    embeddingCreatedAt?: string;
    embeddingQualityScore?: number;
    generatedByAi?: boolean;
    faceProcessedImage: string;
}

export interface PersonDetailDto {
    personId: number;
    fullName: string;
    displayName?: string;
    gender: Gender;
    birthDate?: string;
    nationalId: string;
    externalCode?: string;
    phoneNumber?: string;
    address?: string;
    notes?: string;
    isActive: boolean;
    isDeleted?: boolean;

    // الحقول الأمنية الجديدة
    securityStatus: PersonSecurityStatus;
    dangerLevel: DangerLevel;
    hasActiveAlert?: boolean;
    isArmedAndDangerous?: boolean;
    securityReason?: string;
    caseNumber?: string;
    issuedBy?: string;
    arrestWarrantNumber?: string;
    alertIssuedAt?: string;
    alertExpiresAt?: string;
    lastSeenAt?: string;
    lastSeenLocation?: string;
    distinguishingMarks?: string;
    aliases?: string;
    vehicleInfo?: string;
    securityNotes?: string;
    alertInstructions?: string;

    suspect?: SuspectSummaryDto;
    faceImages: PersonFaceImageDto[];
    totalRecognitions: number;
    lastRecognitionAt?: string;
}

export interface PersonListItemDto {
    personId: number;
    fullName: string;
    displayName?: string;
    gender: Gender;
    nationalId: string;
    isActive: boolean;
    isDeleted: boolean;
    faceImagesCount: number;
    hasSuspectRecord: boolean;
    recognitionCount: number;

    // الحقول الأمنية الجديدة
    securityStatus: PersonSecurityStatus;
    dangerLevel: DangerLevel;
    hasActiveAlert?: boolean;
    isArmedAndDangerous?: boolean;
    lastSeenAt?: string;
    lastSeenLocation?: string;
}

// ── API Response Wrapper ─────────────────────────────────
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface RecognitionResultDto {
    recognized: boolean;
    score: number;
    person?: PersonListItemDto;
    processedFaceBase64?: string;
}
