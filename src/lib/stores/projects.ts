import { writable,get } from 'svelte/store';
import type { TodoRow } from './todo';
export const projectExpandedProjects = writable<Record<string, boolean>>({});
export const projectExpandedSubprojects = writable<Record<string, boolean>>({});
export const projectExpandedTasks = writable<Record<string, boolean>>({});

export interface ProjectTask {
	id: string;
	description: string;  // "Create Projects Tab Functionality"
	startDate: string;    // from TodoItem.date
	endDate: string;      // timestamp when Send is clicked
	rows: TodoRow[];      // the actual todo rows with their completion status
}

export interface ProjectSubproject {
	name: string;         // "TauriHub"
	tasks: ProjectTask[];
}

export interface Project {
	name: string;         // "Prog"
	subprojects: Record<string, ProjectSubproject>;  // keyed by subproject name
}

export const projectsData = writable<Record<string, Project>>({});
export const projectOrder = writable<string[]>([]);

// Delete a project
// deleteProject(projectName: string): void
export function deleteProject(projectName: string): void {
	projectsData.update((projects) => {
		const next = { ...projects };
		delete next[projectName];
		return next;
	});
	projectOrder.update((order) => {
 	return order.filter((id) => id !== projectName);
	});
}

export function deleteSubProject(
	projectName: string,
	subProjectName: string,
): void {
	projectsData.update((projects) => {
		const project = projects[projectName];

		if (!project) return projects;

		const next = {
			...projects,
			[projectName]: {
				...project,
				subprojects: {
					...project.subprojects,
				},
			},
		};

		delete next[projectName].subprojects[subProjectName];

		return next;
	});
}

// deleteTask(projectName: string, subprojectName: string, taskId: string): void
export function deleteTask(projectName: string, subprojectName: string, taskId: string): void {
	projectsData.update((projects) => {
		const project = projects[projectName];
		if (!project) return projects;
		
		const subproject = project.subprojects[subprojectName];
		if (!subproject) return projects;
		
		return {
			...projects,
			[projectName]: {
				...project,
				subprojects: {
					...project.subprojects,
					[subprojectName]: {
						...subproject,
						tasks: subproject.tasks.filter(t => t.id !== taskId)
					}
				}
			}
		};
	});
}

export function initProjectOrder(): string[]{
	const getStringArray = get(projectsData);
	return Object.keys(getStringArray);
}