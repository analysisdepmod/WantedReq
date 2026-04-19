namespace WantedRec.Server.Services
{
    using System.Net.Http.Json;
    using System.Text.Json;
    using WantedRec.Server.DTOs.PythonAIDto;

    public class FaceAiService : IFaceAiService
    {
        private readonly HttpClient _http;
        private readonly ILogger<FaceAiService> _logger;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public FaceAiService(HttpClient http, ILogger<FaceAiService> logger)
        {
            _http = http;
            _logger = logger;
        }

        public async Task<FaceEmbeddingResult> ProcessFaceAsync(
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            // ✅ using على stream لضمان إغلاقه دائماً
            await using var fileStream = file.OpenReadStream();

            using var form = new MultipartFormDataContent();
            using var streamContent = new StreamContent(fileStream);

            streamContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(
                    string.IsNullOrWhiteSpace(file.ContentType)
                        ? "application/octet-stream"
                        : file.ContentType);

            // Query params: نطلب embedding + processed image
            const string endpoint =
                "/api/v1/process-face" +
                "?include_embedding=true" +
                "&include_processed_image=true" +
                "&require_single_face=true";

            form.Add(streamContent, "file", file.FileName);

            _logger.LogInformation(
                "Sending face image to AI service: {FileName} ({Size} bytes)",
                file.FileName, file.Length);

            HttpResponseMessage response;
            try
            {
                response = await _http.PostAsync(endpoint, form, cancellationToken);
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "AI service request timed out.");
                throw new TimeoutException("Face AI service did not respond in time.", ex);
            }

            // ✅ نتعامل مع أخطاء AI بشكل واضح
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "AI service returned {StatusCode}: {Body}",
                    response.StatusCode, errorBody);

                // نحول أخطاء Python (422) إلى رسالة واضحة
                var detail = TryExtractDetail(errorBody);
                throw new InvalidOperationException($"AI service error: {detail}");
            }

            var result = await response.Content
                .ReadFromJsonAsync<FaceEmbeddingResult>(
                    _jsonOptions,
                    cancellationToken: cancellationToken);

            if (result == null)
                throw new InvalidOperationException("AI service returned null result");

            _logger.LogInformation(
                "Face processed successfully. Faces detected: {Count}, Dim: {Dim}",
                result.DetectedFacesCount, result.EmbeddingDimension);

            return result;
        }

        // يستخرج حقل "detail" من JSON error body الخاص بـ FastAPI
        private static string TryExtractDetail(string body)
        {
            try
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("detail", out var detail))
                    return detail.GetString() ?? body;
            }
            catch { /* ignore */ }
            return body;
        }





        public async Task<RecognizeResponseDto> RecognizeAsync(
        IFormFile file,
        CancellationToken cancellationToken = default)
        {
            await using var fileStream = file.OpenReadStream();

            using var form = new MultipartFormDataContent();
            using var streamContent = new StreamContent(fileStream);

            streamContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(
                    string.IsNullOrWhiteSpace(file.ContentType)
                        ? "application/octet-stream"
                        : file.ContentType);

            form.Add(streamContent, "file", file.FileName);

            const string endpoint = "/api/v1/recognize?include_embedding=true";

            HttpResponseMessage response;
            try
            {
                response = await _http.PostAsync(endpoint, form, cancellationToken);
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Recognize request timed out.");
                throw new TimeoutException("Face AI service did not respond in time.", ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("AI recognize returned {StatusCode}: {Body}",
                    response.StatusCode, errorBody);
                throw new InvalidOperationException($"AI service error: {errorBody}");
            }

            var result = await response.Content
                .ReadFromJsonAsync<RecognizeResponseDto>(
                    new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    },
                    cancellationToken: cancellationToken);

            return result ?? new RecognizeResponseDto();
        }
    }





}
