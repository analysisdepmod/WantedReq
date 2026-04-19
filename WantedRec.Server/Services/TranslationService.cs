using System.Net.Http.Headers;

public interface ITranslationService
{
    Task<string> TranslateAsync(string text, bool isArabic, string? token = null);
    bool IsMostlyArabic(string text);
}

public class TranslationService : ITranslationService
{
    private readonly HttpClient _httpClient;

    public TranslationService(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("LocalApi");
    }

    public async Task<string> TranslateAsync(string text, bool isArabic, string? token = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
                return text;

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var request = new TranslationRequest
            {
                Text = text,
                Sl = isArabic ? "ar" : "en",
                Tl = isArabic ? "en" : "ar"
            };

            var response = await _httpClient.PostAsJsonAsync("/api/Translation/translate", request);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }

            return text;
        }
        catch
        {
            return text;
        }
    }

    public bool IsMostlyArabic(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        int arabicCount = 0, letterCount = 0;

        foreach (char c in text)
        {
            if (char.IsLetter(c))
            {
                letterCount++;
                if (c >= 0x0600 && c <= 0x06FF)
                    arabicCount++;
            }
        }

        return letterCount > 0 && ((double)arabicCount / letterCount) >= 0.5;
    }
}
