import { createContext, useContext, useState } from 'react';

const MOCK_PROJECTS = [
  { id: '1', name: 'api-backend',   namespace: 'Administrator' },
  { id: '2', name: 'frontend-app',  namespace: 'Administrator' },
  { id: '3', name: 'mobile-app',    namespace: 'Administrator' },
];

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [selectedProject, setSelectedProject] = useState('all');

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject, projects: MOCK_PROJECTS }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
}
