// ════════════════════════════════════════════════════════
//  src/types/camera.types.ts
//  ضعه في: src/types/camera.types.ts
// ════════════════════════════════════════════════════════

import type { PersonListItemDto } from './person.types';

// ── Camera ───────────────────────────────────────────────

export interface CameraDto {
    cameraId: number;
    name: string;
    code?: string;
    ipAddress: string;
    area?: string;
    isIndoor: boolean;
    isActive: boolean;
}

export interface CameraDetailDto extends CameraDto {
    description?: string;
    streamUrl?: string;
    latitude?: number;
    longitude?: number;
    floor?: string;
    installationDate?: string;
    lastMaintenanceDate?: string;
    notes?: string;
}

// ── Live Recognition (POST /recognition/identify) ────────

 
 

export interface RecognitionFaceDto {
    bbox: number[];
    name: string;
    score: number;
    isKnown: boolean;
    person?: PersonListItemDto;
    primaryImageBase64?: string;
}

export interface LiveRecognitionResultDto {
    faces: RecognitionFaceDto[];
    totalFaces: number;
    knownFaces: number;
}

// ── Recognition History (GET /recognitions) ──────────────

export enum RecognitionStatus {
    Pending = 0,
    Confirmed = 1,
    Rejected = 2,
    FalseAlarm = 3,
}

export const RecognitionStatusLabel: Record<number, string> = {
    0: 'قيد المراجعة',
    1: 'مؤكد',
    2: 'مرفوض',
    3: 'إنذار كاذب',
};

export const RecognitionStatusColor: Record<number, string> = {
    0: 'gold',
    1: 'green',
    2: 'red',
    3: 'default',
};

export interface RecognitionDto {
    recognitionId: number;
    personId?: number;
    personFullName?: string;
    faceImageId?: number;
    snapshotPath?: string;
    cameraId?: number;
    cameraName?: string;
    recognitionScore?: number;
    isMatch?: boolean;
    thresholdUsed?: number;
    recognitionStatus: RecognitionStatus;
    recognitionDateTime: string;
    bBoxX1?: number;
    bBoxY1?: number;
    bBoxX2?: number;
    bBoxY2?: number;
    frameNumber?: number;
    latitude?: number;
    longitude?: number;
    locationDescription?: string;
    createdAt: string;
    reviewNotes?: string;
}

export interface RecognitionReviewDto {
    recognitionId: number;
    isMatch?: boolean;
    recognitionStatus: RecognitionStatus;
    thresholdUsed?: number;
    reviewNotes?: string;
}