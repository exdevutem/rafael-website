import MemberForm from './memberForm';
import ProjectForm from './projectForm';
import type { Member, Project } from '@/shared/types/content';
export default function CreateForm({
  kind,
  member,
  project,
  onClose,
  onCreated,
}: {
  kind: 'member' | 'project';
  member?: Member;
  project?: Project;
  onClose: () => void;
  onCreated: (message: string) => void;
}) {
  return kind === 'member' ? (
    <MemberForm member={member} onClose={onClose} onSaved={onCreated} />
  ) : (
    <ProjectForm project={project} onClose={onClose} onSaved={onCreated} />
  );
}
