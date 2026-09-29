import { Empty, PageHeader } from '@/shared/components/ui/ui';
export default function Profile() {
  return (
    <>
      <PageHeader
        eyebrow="MI PERFIL"
        title="Tu espacio en ExDev"
        description="Tu información, especialidades y visibilidad."
      />
      <section className="rf-panel">
        <Empty title="Tu perfil estará aquí">
          Cuando se conecte tu cuenta podrás consultar tus datos, actualizar tus
          especialidades y decidir la visibilidad de tu perfil. Los roles serán
          asignados por el club.
        </Empty>
      </section>
    </>
  );
}
