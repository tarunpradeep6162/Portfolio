import { useMemo, useState } from 'react';
import type { Project, ProjectCategory } from '@/content/types';

export function useProjectFilter(projects: Project[]) {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    let result = activeCategory === 'All'
      ? projects
      : projects.filter((project) =>
          project.categories.includes(activeCategory)
        );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((project) =>
        project.title.toLowerCase().includes(query) ||
        project.summary.toLowerCase().includes(query) ||
        project.categories.some((cat) => cat.toLowerCase().includes(query))
      );
    }

    return result;
  }, [activeCategory, projects, searchQuery]);

  const flagshipProjects = useMemo(
    () => filteredProjects.filter((p) => p.kind === 'flagship'),
    [filteredProjects]
  );

  const labProjects = useMemo(
    () => filteredProjects.filter((p) => p.kind === 'lab'),
    [filteredProjects]
  );

  return {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    filteredProjects,
    flagshipProjects,
    labProjects,
    totalVisible: filteredProjects.length,
  };
}
