import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { QuestionsPage } from './pages/QuestionsPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { TestsPage } from './pages/TestsPage';
import { TestDetailPage } from './pages/TestDetailPage';
import { TestEvaluationPage } from './pages/TestEvaluationPage';
import { TestAttemptReviewPage } from './pages/TestAttemptReviewPage';
import { OriginsPage } from './pages/OriginsPage';
import { AreasPage } from './pages/AreasPage';
import { CategoryQuestionsPage } from './pages/CategoryQuestionsPage';
import { FoldersPage } from './pages/FoldersPage';
import { FolderDetailPage } from './pages/FolderDetailPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SaveToFolderModal } from './components/folders/SaveToFolderModal';
import { Question } from './types';
import { AuthProvider } from './context/AuthContext';

export const App: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [selectedQuestionForSave, setSelectedQuestionForSave] = useState<Question | null>(null);

  const handleOpenSaveModal = (question: Question) => {
    setSelectedQuestionForSave(question);
    setSaveModalOpen(true);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/questoes" replace />} />
            <Route
              path="/questoes"
              element={<QuestionsPage onBookmarkClick={handleOpenSaveModal} />}
            />
            <Route
              path="/questoes/:id"
              element={<QuestionDetailPage onBookmarkClick={handleOpenSaveModal} />}
            />
            <Route path="/provas" element={<TestsPage />} />
            <Route
              path="/provas/:id"
              element={<TestDetailPage onBookmarkQuestion={handleOpenSaveModal} />}
            />
            <Route path="/provas/:id/avaliacao" element={<TestEvaluationPage />} />
            <Route
              path="/provas/:testId/tentativas/:attemptId"
              element={<TestAttemptReviewPage />}
            />
            <Route path="/bancas" element={<OriginsPage />} />
            <Route
              path="/bancas/:id"
              element={
                <CategoryQuestionsPage
                  type="origin"
                  onBookmarkClick={handleOpenSaveModal}
                />
              }
            />
            <Route path="/areas" element={<AreasPage />} />
            <Route
              path="/areas/:id"
              element={
                <CategoryQuestionsPage
                  type="area"
                  onBookmarkClick={handleOpenSaveModal}
                />
              }
            />
            <Route path="/pastas" element={<FoldersPage />} />
            <Route
              path="/pastas/:id"
              element={<FolderDetailPage onBookmarkQuestion={handleOpenSaveModal} />}
            />
            <Route path="/perfil/:id" element={<UserProfilePage />} />
            {/* Fallback to questoes */}
            <Route path="*" element={<Navigate to="/questoes" replace />} />
          </Routes>

          {/* Global Save To Folder Modal */}
          <SaveToFolderModal
            open={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            question={selectedQuestionForSave}
          />
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};
