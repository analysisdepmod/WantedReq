namespace WantedRec.Server.DTOs
{
    public class ApiResponse<T>
    {
        public bool Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static ApiResponse<T> Success(T data, string message) =>
            new ApiResponse<T> { Status = true, Message = message, Data = data };

        public static ApiResponse<T> Fail(string message) =>
            new ApiResponse<T> { Status = false, Message = message, Data = default };
    }

}
