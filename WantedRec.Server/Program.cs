using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters;
using WantedRec.Server;
using WantedRec.Services;
using Python.Runtime;





var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<JWT>(builder.Configuration.GetSection("JWT"));

builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<ApplicationDbContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddSingleton<PythonService>();
//builder.Services.AddHostedService<BackgroundPythonService>();

//Runtime.PythonDLL = @"C:\Users\abd\AppData\Local\Programs\Python\Python312\python312.dll";
//PythonEngine.Initialize();
// Retrieve the Python DLL path from the environment variable
string pythonDllPath = Environment.GetEnvironmentVariable("PYTHON_DLL") ?? @"C:\python312\python312.dll";


// Set the Python DLL path
Runtime.PythonDLL = pythonDllPath;

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.SignIn.RequireConfirmedAccount = false;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 6;
    options.Lockout.AllowedForNewUsers = true;


})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager()
    .AddRoles<ApplicationRole>();


//1
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/wantedrec/Account/Login";
    options.AccessDeniedPath = "/wantedrec/Account/AccessDenied";
    options.LogoutPath = "/wantedrec/Account/Logout";
});
////
builder.Services.AddHttpClient("LocalApi", client =>
{
    client.BaseAddress = new Uri("http://localhost:5454");
});

//builder.Services.AddAuthorization(options =>
//{
//    options.AddPolicy("ApiUser", policy => policy.RequireClaim("rol", "api_access"));
//});


// JWT 
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    // options.RequireHttpsMetadata = false;

    options.TokenValidationParameters = new()
    {

        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidAudience = builder.Configuration["JWT:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Key"]!)),
        ClockSkew = TimeSpan.Zero,

    };
    // ✅ دعم كل Hubs بقراءة access_token من Query
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            // ⛔ لا تقيّد بمسار واحد، اقبل أي Hub
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});
builder.Services.AddHttpClient<IFaceAiService, FaceAiService>(client =>
{
    Console.WriteLine(builder.Configuration["FaceAiService:PythonBaseUrl"]);
    client.BaseAddress = new Uri(
        builder.Configuration["FaceAiService:PythonBaseUrl"]
        ?? "http://localhost:8000");

    // ✅ Timeout واضح لمنع التعليق
    client.Timeout = TimeSpan.FromSeconds(30);
});


// Add services to the container.
builder.Services.AddSignalR().AddHubOptions<ChatHub>(options =>
{
    options.ClientTimeoutInterval = TimeSpan.FromMinutes(2);
});
builder.Services.AddSingleton<IUserIdProvider, NameIdentifierUserIdProvider>();
builder.Services.AddScoped<IPersonService, PersonsService>();
 
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddControllers();
builder.Services.AddMvc();
//builder.Services.AddJsReport(new LocalReporting()
//                      // .RunInDirectory(Path.Combine(Directory.GetCurrentDirectory(), "jsreport"))
//                       // .Configure(cfg => cfg.FileSystemStore().BaseUrlAsWorkingDirectory())
//                    .KillRunningJsReportProcesses()
//                    .UseBinary(JsReportBinary.GetBinary())
//                    .AsUtility()
//                    .KeepAlive(false)
//                    .Create()
//                    );

builder.Services.AddEndpointsApiExplorer();
//Add authentication to Swagger UI
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });

    options.OperationFilter<SecurityRequirementsOperationFilter>();
});

builder.Services.AddScoped<IUser, UserService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SPNIPolicy",


      x => x.WithOrigins(["http://192.168.19.107:1011", "https://localhost:5555", "https://192.168.19.107:1001", "https://localhost:1001"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
           );
});

builder.Services.AddHttpContextAccessor(); //for get logged user

var app = builder.Build();

// Ensure Python engine is properly shut down on application stopping
app.Lifetime.ApplicationStopping.Register(() =>
{
    var pythonService = app.Services.GetService<PythonService>();
    pythonService?.Dispose(); // Clean up on shutdown
});

//2
app.Use(async (context, next) =>
{


    await next();
});
///
app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("SPNIPolicy");
app.UseAuthentication();
app.UseAuthorization();
//app.MapIdentityApi<ApplicationUser>();

app.MapHub<NotificationHub>("/hubs/NotificationHub");
app.MapHub<ChatHub>("/hubs/chathub");
app.MapHub<PresenceHub>("/hubs/presencehub");
app.MapControllers();


app.MapFallbackToFile("index.html");


app.Run();
