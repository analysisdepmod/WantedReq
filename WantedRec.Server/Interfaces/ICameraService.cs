// ════════════════════════════════════════════════════════
//  WantedRec.Server/Services/ICameraService.cs
// ════════════════════════════════════════════════════════

namespace WantedRec.Server.Interfaces
{
    public interface ICameraService
    {
        /// <summary>جلب كل الكاميرات مع إمكانية فلترة بالحالة</summary>
        Task<List<CameraDto>> GetAllAsync(
            bool? isActive = null,
            CancellationToken ct = default);

        /// <summary>جلب كاميرا واحدة بالتفاصيل الكاملة</summary>
        Task<CameraDetailDto?> GetByIdAsync(
            int id,
            CancellationToken ct = default);

        /// <summary>إنشاء كاميرا جديدة</summary>
        Task<CameraDetailDto> CreateAsync(
            CameraUpsertDto dto,
            CancellationToken ct = default);

        /// <summary>تحديث بيانات كاميرا موجودة — null لو ما وُجدت</summary>
        Task<CameraDetailDto?> UpdateAsync(
            int id,
            CameraUpsertDto dto,
            CancellationToken ct = default);

        /// <summary>حذف كاميرا — false لو ما وُجدت</summary>
        Task<bool> DeleteAsync(
            int id,
            CancellationToken ct = default);

        /// <summary>تفعيل أو تعطيل كاميرا — false لو ما وُجدت</summary>
        Task<bool> SetActiveAsync(
            int id,
            bool isActive,
            CancellationToken ct = default);

        /// <summary>إحصائيات مختصرة لكاميرا: عدد التعرفات اليوم وآخر وقت</summary>
        Task<CameraStatsDto> GetStatsAsync(
            int id,
            CancellationToken ct = default);
    }

    /// <summary>إحصائيات خفيفة تُرفق مع التفاصيل</summary>
    public class CameraStatsDto
    {
        public int RecognitionsToday { get; set; }
        public int TotalRecognitions { get; set; }
        public DateTime? LastRecognitionAt { get; set; }
    }
}