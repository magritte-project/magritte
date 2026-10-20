import { describe, expect, it, vi } from "vitest"

import { promiseResolver } from "./promises"
import { TaskProgressReporter, type TaskProgressReporterEvent } from "./taskProgress"

function recordEvents(subject: TaskProgressReporter): TaskProgressReporterEvent[] {
    const events: TaskProgressReporterEvent[] = []
    subject.subscribe((event) => {
        events.push(event)
    })
    return events
}

describe("TaskProgressReporter", () => {
    describe("#perform", () => {
        it("should return the task's result", async () => {
            const subject = new TaskProgressReporter()
            const result = await subject.perform({ label: "Task", totalUnits: 1 }, async () => 42)
            expect(result).toBe(42)
        })

        it("should track the task while it is running", async () => {
            const subject = new TaskProgressReporter()
            const gate = promiseResolver<void>()
            const task = subject.perform({ label: "Downloading", totalUnits: 3 }, async () => {
                await gate.promise
            })

            await Promise.resolve()
            expect(subject.activeTaskCount).toBe(1)
            const [id] = Array.from(subject.activeTaskIds)
            expect(subject.getTaskLabel(id)).toBe("Downloading")

            gate.resolve()
            await task
            expect(subject.activeTaskCount).toBe(0)
            expect(Array.from(subject.activeTaskIds)).toStrictEqual([])
            expect(subject.getTaskLabel(id)).toBeUndefined()
        })

        it("should give each task a unique ID", async () => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            await subject.perform({ label: "First", totalUnits: 1 }, async () => {})
            await subject.perform({ label: "Second", totalUnits: 1 }, async () => {})

            const startedIds = events
                .filter((event) => event.type === "taskStarted")
                .map((event) => event.id)
            expect(startedIds).toHaveLength(2)
            expect(new Set(startedIds).size).toBe(2)
        })

        it("should report the lifecycle of a successful task", async () => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            await subject.perform({ label: "Task", totalUnits: 2 }, async ({ advance }) => {
                advance()
                advance()
            })

            const [{ id }] = events
            expect(events).toStrictEqual([
                { type: "taskStarted", id },
                { type: "taskProgressed", id, totalUnits: 2, completedUnits: 1 },
                { type: "taskProgressed", id, totalUnits: 2, completedUnits: 2 },
                { type: "taskEnded", id },
            ])
        })

        it("should report and rethrow an unhandled failure", async () => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            const error = new Error("Something went wrong")
            await expect(
                subject.perform({ label: "Task", totalUnits: 1 }, async () => {
                    throw error
                }),
            ).rejects.toBe(error)

            const [{ id }] = events
            expect(events).toStrictEqual([
                { type: "taskStarted", id },
                { type: "taskFailed", id, reason: error, handled: false },
            ])
            expect(subject.activeTaskCount).toBe(0)
        })

        it.each([0, -1])("should reject a total of %d without starting the task", async (total) => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            const task = vi.fn(async () => {})
            await expect(
                subject.perform({ label: "Task", totalUnits: total }, task),
            ).rejects.toThrow("Invalid total for task")

            expect(task).not.toHaveBeenCalled()
            expect(events).toStrictEqual([])
            expect(subject.activeTaskCount).toBe(0)
        })
    })

    describe("TaskBag", () => {
        it("should advance by 1 by default", async () => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            await subject.perform({ label: "Task", totalUnits: 5 }, async ({ advance }) => {
                advance()
            })
            expect(events).toContainEqual(expect.objectContaining({ completedUnits: 1 }))
        })

        it("should advance by a given amount", async () => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            await subject.perform({ label: "Task", totalUnits: 5 }, async ({ advance }) => {
                advance(3)
            })
            expect(events).toContainEqual(expect.objectContaining({ completedUnits: 3 }))
        })

        it("should clamp progress between 0 and the total", async () => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            await subject.perform({ label: "Task", totalUnits: 5 }, async ({ advance }) => {
                advance(10)
                advance(-20)
            })

            const completed = events
                .filter((event) => event.type === "taskProgressed")
                .map((event) => event.completedUnits)
            expect(completed).toStrictEqual([5, 0])
        })

        it("should report a handled failure without ending the task", async () => {
            const subject = new TaskProgressReporter()
            const events = recordEvents(subject)
            const result = await subject.perform(
                { label: "Task", totalUnits: 1 },
                async ({ handledFailure }) => {
                    handledFailure("Skipped one")
                    return "done"
                },
            )

            expect(result).toBe("done")
            const [{ id }] = events
            expect(events).toStrictEqual([
                { type: "taskStarted", id },
                { type: "taskFailed", id, reason: "Skipped one", handled: true },
                { type: "taskEnded", id },
            ])
        })
    })

    describe("progress", () => {
        it("should return undefined for unknown tasks", () => {
            const subject = new TaskProgressReporter()
            expect(subject.getTaskLabel(0)).toBeUndefined()
            expect(subject.getTaskPercent(0)).toBeUndefined()
        })

        it("should report no combined progress when there are no active tasks", async () => {
            const subject = new TaskProgressReporter()
            expect(subject.completedPercent).toBe(0)

            await subject.perform({ label: "Task", totalUnits: 2 }, async ({ advance }) => {
                advance(2)
            })
            expect(subject.completedPercent).toBe(0)
        })

        it("should report the progress of a single task", async () => {
            const subject = new TaskProgressReporter()
            const gate = promiseResolver<void>()
            const task = subject.perform({ label: "Task", totalUnits: 4 }, async ({ advance }) => {
                advance()
                await gate.promise
            })

            await Promise.resolve()
            const [id] = Array.from(subject.activeTaskIds)
            expect(subject.getTaskPercent(id)).toBe(0.25)

            gate.resolve()
            await task
        })

        it("should report the combined progress of all active tasks", async () => {
            const subject = new TaskProgressReporter()
            const firstGate = promiseResolver<void>()
            const secondGate = promiseResolver<void>()
            const first = subject.perform(
                { label: "First", totalUnits: 2 },
                async ({ advance }) => {
                    advance(2)
                    await firstGate.promise
                },
            )
            const second = subject.perform(
                { label: "Second", totalUnits: 6 },
                async ({ advance }) => {
                    advance(1)
                    await secondGate.promise
                },
            )

            await Promise.resolve()
            // 3 of 8 units across both tasks
            expect(subject.completedPercent).toBe(3 / 8)

            firstGate.resolve()
            await first
            // Only the second task is still active
            expect(subject.completedPercent).toBe(1 / 6)

            secondGate.resolve()
            await second
        })
    })
})
