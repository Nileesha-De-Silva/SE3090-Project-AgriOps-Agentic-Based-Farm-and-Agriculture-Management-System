using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Controllers;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component2.Controllers;

public class TasksControllerTests
{
    private readonly FakeTaskService _fakeTaskService;
    private readonly TasksController _controller;

    public TasksControllerTests()
    {
        _fakeTaskService = new FakeTaskService();
        _controller = new TasksController(_fakeTaskService);
    }

    [Fact]
    public async Task GetTasks_ReturnsOk_WithMappedTaskResponseDtos()
    {
        var task1 = TestDataBuilder.CreateFarmTask(taskType: "Irrigation", priority: "Low");
        var task2 = TestDataBuilder.CreateFarmTask(taskType: "Weeding", priority: "High");
        _fakeTaskService.Tasks.AddRange(new[] { task1, task2 });

        var result = await _controller.GetTasks(status: null, priority: null, fieldId: null, workerId: null);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<TaskResponseDto>>(okResult.Value).ToList();
        Assert.Equal(2, dtos.Count);
        Assert.Contains(dtos, d => d.TaskType == "Irrigation");
        Assert.Contains(dtos, d => d.TaskType == "Weeding");
    }

    [Fact]
    public async Task GetTaskById_WhenExists_ReturnsOkWithTaskResponseDto()
    {
        var task = TestDataBuilder.CreateFarmTask(taskType: "PesticideApplication");
        _fakeTaskService.Tasks.Add(task);

        var result = await _controller.GetTaskById(task.Id);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<TaskResponseDto>(okResult.Value);
        Assert.Equal(task.Id, dto.Id);
        Assert.Equal("PesticideApplication", dto.TaskType);
    }

    [Fact]
    public async Task GetTaskById_WhenNotFound_ReturnsNotFound()
    {
        var result = await _controller.GetTaskById(Guid.NewGuid());
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateTask_ValidDto_ReturnsCreatedAtAction_WithUtcTimestamp()
    {
        var fieldId = Guid.NewGuid();
        var targetDate = DateTime.UtcNow.AddDays(3);
        var dto = new CreateTaskDto(
            FieldId: fieldId,
            CropSeasonId: null,
            Title: "Spraying Tomato Blight",
            TaskType: "PesticideApplication",
            Priority: "High",
            Description: "Apply fungicide according to prescription.",
            TargetDate: targetDate
        );

        var result = await _controller.CreateTask(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(TasksController.GetTaskById), createdResult.ActionName);

        var responseDto = Assert.IsType<TaskResponseDto>(createdResult.Value);
        Assert.Equal("Spraying Tomato Blight", responseDto.Title);
        Assert.Equal(fieldId, responseDto.FieldId);
        Assert.Equal("Pending", responseDto.Status);
    }

    [Fact]
    public async Task AssignWorker_WhenValid_ReturnsOkWithAssignmentDto()
    {
        var task = TestDataBuilder.CreateFarmTask(status: "Pending");
        _fakeTaskService.Tasks.Add(task);
        var workerId = Guid.NewGuid();

        var result = await _controller.AssignWorker(task.Id, new AssignWorkerDto(workerId));

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var assignmentDto = Assert.IsType<TaskAssignmentDto>(okResult.Value);
        Assert.Equal(task.Id, assignmentDto.TaskId);
        Assert.Equal(workerId, assignmentDto.WorkerId);
        Assert.Equal("Active", assignmentDto.Status);
    }

    [Fact]
    public async Task AssignWorker_WhenTaskOrWorkerNotFound_ReturnsNotFound()
    {
        _fakeTaskService.AssignWorkerHandler = (taskId, workerId) =>
            throw new InvalidOperationException($"Task with ID '{taskId}' not found.");

        var result = await _controller.AssignWorker(Guid.NewGuid(), new AssignWorkerDto(Guid.NewGuid()));
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateTaskStatus_WhenValid_ReturnsOkWithUpdatedTask()
    {
        var task = TestDataBuilder.CreateFarmTask(status: "Assigned");
        _fakeTaskService.Tasks.Add(task);

        var userId = Guid.NewGuid();
        var updateDto = new UpdateTaskStatusDto("InProgress", userId, "Work underway.");

        var result = await _controller.UpdateTaskStatus(task.Id, updateDto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var responseDto = Assert.IsType<TaskResponseDto>(okResult.Value);
        Assert.Equal("InProgress", responseDto.Status);
    }

    [Fact]
    public async Task VerifyEvidence_WhenApproved_ReturnsCompletedTask()
    {
        var task = TestDataBuilder.CreateFarmTask(status: "PendingVerification");
        _fakeTaskService.Tasks.Add(task);

        var managerId = Guid.NewGuid();
        var verifyDto = new VerifyEvidenceDto(IsApproved: true, ManagerUserId: managerId, Remarks: "Approved.");

        var result = await _controller.VerifyEvidence(task.Id, verifyDto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var responseDto = Assert.IsType<TaskResponseDto>(okResult.Value);
        Assert.Equal("Completed", responseDto.Status);
    }
}
