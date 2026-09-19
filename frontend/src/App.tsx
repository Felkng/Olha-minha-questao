import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { Navbar } from './components/Navbar';
import { QuestionsView } from './components/QuestionsView';
import { TestListView } from './components/TestListView';
import { TestEvaluationView } from './components/TestEvaluationView';
import { OriginListView } from './components/OriginListView';
import { AreaListView } from './components/AreaListView';
import { CategoryQuestionsView } from './components/CategoryQuestionsView';
import { FoldersView } from './components/FoldersView';
import { SaveToFolderModal } from './components/SaveToFolderModal';
import { Question } from './types';

export const App: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [selectedQuestionForSave, setSelectedQuestionForSave] = useState<Question | null>(null);

  const handleOpenSaveModal = (question: Question) => {
    setSelectedQuestionForSave(question);
    setSaveModalOpen(true);
  };

  return (
    <BrowserRouter>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Horizontal Navbar at top with router links */}
        <Navbar />

        {/* Main Content Area */}
        <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/questoes" replace />} />
            <Route
              path="/questoes"
              element={<QuestionsView onBookmarkClick={handleOpenSaveModal} />}
            />
            <Route path="/provas" element={<TestListView />} />
            <Route path="/provas/:id" element={<TestEvaluationView />} />
            <Route path="/bancas" element={<OriginListView />} />
            <Route
              path="/bancas/:id"
              element={
                <CategoryQuestionsView
                  type="origin"
                  onBookmarkClick={handleOpenSaveModal}
                />
              }
            />
            <Route path="/areas" element={<AreaListView />} />
            <Route
              path="/areas/:id"
              element={
                <CategoryQuestionsView
                  type="area"
                  onBookmarkClick={handleOpenSaveModal}
                />
              }
            />
            <Route
              path="/pastas"
              element={<FoldersView onOpenSaveModal={handleOpenSaveModal} />}
            />
            {/* Fallback to questoes */}
            <Route path="*" element={<Navigate to="/questoes" replace />} />
          </Routes>
        </Container>

        {/* Modal para salvar em pastas */}
        <SaveToFolderModal
          open={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          question={selectedQuestionForSave}
        />

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Olha Minha Questão &copy; {new Date().getFullYear()} — Plataforma de Estudo e Resolução de Questões
          </Typography>
        </Box>
      </Box>
    </BrowserRouter>
  );
};
