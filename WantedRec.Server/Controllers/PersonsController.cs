using Microsoft.AspNetCore.Mvc;
using NuGet.Frameworks;
using System.Net;

namespace WantedRec.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonsController : ControllerBase
    {
        private readonly IPersonService _personService;
        private readonly ILogger<PersonsController> _logger;
      

        public PersonsController(IPersonService personService, ILogger<PersonsController> logger)
        {
            _personService = personService;
            _logger = logger;
           
        }
        


        // ─────────────────────────────────────────────
        //  GET ALL  →  GET /api/persons?search=&isActive=
        // ─────────────────────────────────────────────
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PersonListItemDto>>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<ApiResponse<IEnumerable<PersonListItemDto>>>> GetAllAsync( [FromQuery] string? search = null, [FromQuery] bool? isActive = null, bool? isDeleted = null, CancellationToken cancellationToken = default)
        {
            var persons = await _personService.GetListAsync(search, isActive,isDeleted, cancellationToken);
            return Ok(ApiResponse<IEnumerable<PersonListItemDto>>
                .Success(persons, "Persons list loaded successfully"));
        }

        // ─────────────────────────────────────────────
        //  GET BY ID  →  GET /api/persons/{id}
        // ─────────────────────────────────────────────
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<PersonDetailDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<PersonDetailDto>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<PersonDetailDto>>> GetByIdAsync( int id, CancellationToken cancellationToken = default)
        {
            // ✅ تحقق من صحة الـ id
            if (id <= 0)
                return BadRequest(ApiResponse<PersonDetailDto>.Fail("Invalid person ID"));

            var person = await _personService.GetByIdAsync(id, cancellationToken);

            if (person is null)
                return NotFound(ApiResponse<PersonDetailDto>.Fail($"Person with ID {id} not found"));

            return Ok(ApiResponse<PersonDetailDto>.Success(person, "Person loaded successfully"));
        }

        // ─────────────────────────────────────────────
        //  CREATE  →  POST /api/persons
        // ─────────────────────────────────────────────
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<PersonDetailDto>), (int)HttpStatusCode.Created)]
        [ProducesResponseType(typeof(ApiResponse<PersonDetailDto>), (int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<ApiResponse<PersonDetailDto>>> CreateAsync(  [FromBody] PersonUpsertDto dto,  CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
            {
                // ✅ نرجع تفاصيل أخطاء الـ validation
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse<PersonDetailDto>.Fail(
                    string.Join(" | ", errors)));
            }

            dto.PersonId = null;

            try
            {
                var result = await _personService.CreateAsync(dto, cancellationToken);

                return CreatedAtAction(
                    nameof(GetByIdAsync),
                    new { id = result.PersonId },
                    ApiResponse<PersonDetailDto>.Success(result, "Person created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating person");
                return StatusCode(
                    (int)HttpStatusCode.InternalServerError,
                    ApiResponse<PersonDetailDto>.Fail("An error occurred while creating the person"));
            }
        }

        // ─────────────────────────────────────────────
        //  UPDATE  →  PUT /api/persons/{id}
        // ─────────────────────────────────────────────
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<PersonDetailDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<PersonDetailDto>), (int)HttpStatusCode.NotFound)]
        [ProducesResponseType(typeof(ApiResponse<PersonDetailDto>), (int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<ApiResponse<PersonDetailDto>>> UpdateAsync( int id, [FromBody] PersonUpsertDto dto,CancellationToken cancellationToken = default)
        {
            if (id <= 0)
                return BadRequest(ApiResponse<PersonDetailDto>.Fail("Invalid person ID"));

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse<PersonDetailDto>.Fail(
                    string.Join(" | ", errors)));
            }

            dto.PersonId = id;

            try
            {
                var updated = await _personService.UpdateAsync(dto, cancellationToken);

                if (updated is null)
                    return NotFound(ApiResponse<PersonDetailDto>.Fail($"Person with ID {id} not found"));

                return Ok(ApiResponse<PersonDetailDto>.Success(updated, "Person updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating person {PersonId}", id);
                return StatusCode(
                    (int)HttpStatusCode.InternalServerError,
                    ApiResponse<PersonDetailDto>.Fail("An error occurred while updating the person"));
            }
        }

        // ─────────────────────────────────────────────
        //  SOFT DELETE  →  DELETE /api/persons/{id}
        // ─────────────────────────────────────────────
        [HttpDelete("{id:int}")]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> SoftDeleteAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            if (id <= 0)
                return BadRequest(ApiResponse<object>.Fail("Invalid person ID"));

            var success = await _personService.SoftDeleteAsync(id, cancellationToken);

            if (!success)
                return NotFound(ApiResponse<object>.Fail($"Person with ID {id} not found or already deleted"));

            return Ok(ApiResponse<object>.Success(null!, "Person deleted successfully"));
        }

        // ─────────────────────────────────────────────
        //  ACTIVATE  →  PUT /api/persons/{id}/activate
        // ─────────────────────────────────────────────
        [HttpPut("{id:int}/activate")]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> ActivateAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            if (id <= 0)
                return BadRequest(ApiResponse<object>.Fail("Invalid person ID"));

            var success = await _personService.SetActiveAsync(id, true, cancellationToken);

            if (!success)
                return NotFound(ApiResponse<object>.Fail($"Person with ID {id} not found"));

            return Ok(ApiResponse<bool>.Success(true, "Person activated successfully"));
        }

        // ─────────────────────────────────────────────
        //  DEACTIVATE  →  PUT /api/persons/{id}/deactivate
        // ─────────────────────────────────────────────
        [HttpPut("{id:int}/deactivate")]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> DeactivateAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            if (id <= 0)
                return BadRequest(ApiResponse<object>.Fail("Invalid person ID"));

            var success = await _personService.SetActiveAsync(id, false, cancellationToken);

            if (!success)
                return NotFound(ApiResponse<object>.Fail($"Person with ID {id} not found"));

            return Ok(ApiResponse<bool>.Success(false, "Person deactivated successfully"));
        }

        // ─────────────────────────────────────────────
        //  FACE IMAGES  →  GET /api/persons/{id}/face-images
        // ─────────────────────────────────────────────
        [HttpGet("{id:int}/face-images")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PersonFaceImageDto>>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PersonFaceImageDto>>), (int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<ApiResponse<IEnumerable<PersonFaceImageDto>>>> GetFaceImagesAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            if (id <= 0)
                return BadRequest(ApiResponse<IEnumerable<PersonFaceImageDto>>.Fail("Invalid person ID"));

            var images = await _personService.GetFaceImagesAsync(id, cancellationToken);

            if (images is null)
                return NotFound(ApiResponse<IEnumerable<PersonFaceImageDto>>
                    .Fail($"Person with ID {id} not found"));

            return Ok(ApiResponse<IEnumerable<PersonFaceImageDto>>
                .Success(images, "Face images loaded successfully"));
        }
    }
}