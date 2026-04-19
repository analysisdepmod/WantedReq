namespace WantedRec.Server.Services
{
    public class BackgroundPythonService : IHostedService
    {
        private readonly PythonService _pythonService;

        public BackgroundPythonService(PythonService pythonService)
        {
            _pythonService = pythonService;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            // Start background work here if needed
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _pythonService.Dispose(); // Cleanup when stopping
            return Task.CompletedTask;
        }
    }

}
