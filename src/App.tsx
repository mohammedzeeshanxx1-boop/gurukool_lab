/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLayout } from "./components/layout/AppLayout";
import { CurriculumPage } from "./pages/CurriculumPage";
import { LaboratoriesPage } from "./pages/LaboratoriesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OverviewPage } from "./pages/OverviewPage";
import { TeacherPage } from "./pages/TeacherPage";
import { TutorPage } from "./pages/TutorPage";
import { RouterProvider, useRouter } from "./router/RouterContext";

function RouteView() {
  const { currentPath } = useRouter();

  switch (currentPath) {
    case "/":
      return <OverviewPage />;
    case "/labs":
      return <LaboratoriesPage />;
    case "/curriculum":
      return <CurriculumPage />;
    case "/tutor":
      return <TutorPage />;
    case "/teacher":
      return <TeacherPage />;
    default:
      return <NotFoundPage path={currentPath} />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      <AppLayout>
        <RouteView />
      </AppLayout>
    </RouterProvider>
  );
}
