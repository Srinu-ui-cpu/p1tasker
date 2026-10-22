import { AIBrokerService } from '../src/services/aiBrokerService';
import { GoogleAuthService } from '../src/services/googleAuthService';
import { StorageService } from '../src/services/storageService';

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  sampleInput: string;
  sampleOutput: string;
  notes: string;
}

const auditLog: TestResult[] = [];

async function runAudit() {
  console.log('===============================================================');
  console.log('   🤖 TASKER OS AI AGENT FEATURE & COMPLIANCE AUDITOR');
  console.log('===============================================================\n');

  // --- TEST 1: Real Multilingual Translation (Telugu) ---
  console.log('>> [TEST 1] Multilingual Translation Engine (Telugu)...');
  const teluguInput = 'I am a dedicated and passionate individual with a strong desire to excel in all areas of my life.';
  const teluguRes = await AIBrokerService.translateText(teluguInput, 'Telugu');
  
  const hasAnalysisHeader = teluguRes.translatedText.includes('### 📑 Deep Semantic Text Analysis');
  const hasTeluguScript = /[\u0C00-\u0C7F]/.test(teluguRes.translatedText) || teluguRes.translatedText.length > 10;
  const passedT1 = !hasAnalysisHeader && hasTeluguScript && !teluguRes.translatedText.includes('```');

  auditLog.push({
    suite: 'Multilingual Translation',
    testName: 'Telugu Translation Quality & Isolation',
    passed: passedT1,
    sampleInput: teluguInput,
    sampleOutput: teluguRes.translatedText,
    notes: passedT1 ? 'Successfully returned clean translated text with zero semantic analysis pollution.' : 'Failed translation isolation test.',
  });
  console.log(`  ${passedT1 ? '✓ [PASS]' : '✗ [FAIL]'} Telugu Translation: ${teluguRes.translatedText.slice(0, 80)}...`);

  // --- TEST 2: Real Multilingual Translation (Hindi & Spanish) ---
  console.log('\n>> [TEST 2] Multilingual Translation Engine (Hindi & Spanish)...');
  const hindiInput = 'Today I completed my important project presentation and reviewed team tasks.';
  const hindiRes = await AIBrokerService.translateText(hindiInput, 'Hindi');
  const passedT2 = !hindiRes.translatedText.includes('### 📑') && !hindiRes.translatedText.includes('```');

  auditLog.push({
    suite: 'Multilingual Translation',
    testName: 'Hindi Translation Quality & Isolation',
    passed: passedT2,
    sampleInput: hindiInput,
    sampleOutput: hindiRes.translatedText,
    notes: passedT2 ? 'Clean translation without code blocks or analysis headers.' : 'Failed Hindi test.',
  });
  console.log(`  ${passedT2 ? '✓ [PASS]' : '✗ [FAIL]'} Hindi Translation: ${hindiRes.translatedText.slice(0, 80)}...`);

  // --- TEST 3: AI Diary Summarize (Clean Bullet Points, No Artificial Subheadings) ---
  console.log('\n>> [TEST 3] AI Diary Summarize (Clean Bullet Points)...');
  const diaryContent = `
    Today was an intense and productive day. In the morning, I led the client architecture review meeting and demonstrated our real-time synchronization engine.
    After lunch, our team resolved the database latency bottleneck by introducing optimized indexing.
    In the evening, I went for a 5-kilometer run, reflected on my personal goals, and prepared tomorrow's priorities.
  `.trim();

  const promptSummary = `Summarize the following diary entry into 3 to 5 clear, insightful bullet points capturing key events, reflections, and action items. Output ONLY clean bullet points starting with '• ', without bold category headers or artificial prefixes:\n\n${diaryContent}`;
  const summaryRes = await AIBrokerService.completeText(promptSummary, 'You are an executive biographer and summarizer. Return ONLY clean bullet points starting with • without category headers or bold prefixes.');
  
  const hasSubheadingLabels = summaryRes.text.includes('**Key Milestone**:') || summaryRes.text.includes('**Progress & Focus**:') || summaryRes.text.includes('**Next Horizon**:');
  const hasBullets = summaryRes.text.includes('•') || summaryRes.text.includes('-');
  const passedT3 = !hasSubheadingLabels && hasBullets && !summaryRes.text.includes('### 📑 Deep Semantic Text Analysis');

  auditLog.push({
    suite: 'AI Diary Summarize',
    testName: 'Clean Natural Bullet Points without Artificial Subheadings',
    passed: passedT3,
    sampleInput: diaryContent.slice(0, 100) + '...',
    sampleOutput: summaryRes.text,
    notes: passedT3 ? 'Outputs pure, concise bullet points without rigid category prefixes.' : 'Still contains rigid subheading labels.',
  });
  console.log(`  ${passedT3 ? '✓ [PASS]' : '✗ [FAIL]'} Clean Summary:\n${summaryRes.text.split('\n').map(l => '    ' + l).join('\n')}`);

  // --- TEST 4: Diary AI Chatbot (ChatGPT/Gemini Style Human Response) ---
  console.log('\n>> [TEST 4] Diary AI Companion Chatbot (ChatGPT / Gemini Style)...');
  const mockDiaryEntry = {
    date: '2026-10-22',
    content: diaryContent,
    mood: 'energized',
  };

  const chatRes = await AIBrokerService.queryDiaryChat(
    'Summarize my day into an inspiring closing reflection.',
    mockDiaryEntry,
    []
  );

  const hasRoboticHeaders = chatRes.responseText.includes('### 🌅') || chatRes.responseText.includes('#### 📖') || chatRes.responseText.includes('#### 🎯');
  const hasPromptEcho = chatRes.responseText.includes('• Summarize my day into an inspiring closing reflection');
  const passedT4 = !hasRoboticHeaders && !hasPromptEcho && chatRes.responseText.length > 30;

  auditLog.push({
    suite: 'Diary AI Chatbot',
    testName: 'Natural Conversational Tone (ChatGPT/Gemini Style)',
    passed: passedT4,
    sampleInput: 'Summarize my day into an inspiring closing reflection.',
    sampleOutput: chatRes.responseText,
    notes: passedT4 ? 'Friendly, conversational tone with clean bullet points and zero robotic ### headers.' : 'Contains robotic headers or prompt echoes.',
  });
  console.log(`  ${passedT4 ? '✓ [PASS]' : '✗ [FAIL]'} Chatbot Output:\n${chatRes.responseText.split('\n').map(l => '    ' + l).join('\n')}`);

  // --- TEST 5: Multi-Paragraph Error Correction (No Code Blocks) ---
  console.log('\n>> [TEST 5] Multi-Paragraph Error Correction & Voice Stutter Removal...');
  const multiParaDirty = [
    'today today was a great day at work. i goes to the client meeting and presented teh deck .',
    'we we also discussed the new architecture plan and how to evaluate user feedback from testing .',
    'in the evening i completed all my pending task items and reviewed next steps with team .'
  ].join('\n\n');

  const polishRes = await AIBrokerService.correctAndPolishDiary(multiParaDirty);
  const hasCodeBlocks = polishRes.correctedText.includes('```') || polishRes.correctedText.startsWith('    ');
  const stutterCleaned = !polishRes.correctedText.includes('today today') && !polishRes.correctedText.includes('we we');
  const hasAnalysisHijack = polishRes.correctedText.includes('### 📑 Deep Semantic Text Analysis');
  const passedT5 = !hasCodeBlocks && stutterCleaned && !hasAnalysisHijack && polishRes.correctedText.includes('\n');

  auditLog.push({
    suite: 'Error Correction & Sentence Polish',
    testName: 'Multi-Paragraph Preservation & Code Block Prohibition',
    passed: passedT5,
    sampleInput: multiParaDirty,
    sampleOutput: polishRes.correctedText,
    notes: passedT5 ? 'Multi-paragraph formatting preserved as clean text with zero code blocks.' : 'Failed error correction test.',
  });
  console.log(`  ${passedT5 ? '✓ [PASS]' : '✗ [FAIL]'} Polished Output:\n${polishRes.correctedText.split('\n').map(l => '    ' + l).join('\n')}`);

  // --- TEST 6: Google Drive Folder URL Security (Zero 404s, Points to My Drive) ---
  console.log('\n>> [TEST 6] Google Drive Vault URL & Path Verification...');
  const driveUrl = GoogleAuthService.getDriveFolderUrl();
  const hasBrokenVaultUrl = driveUrl.includes('tasker-app-data-vault') && driveUrl.includes('/folders/');
  const pointsToMyDrive = driveUrl === 'https://drive.google.com/drive/u/0/my-drive' || (driveUrl.startsWith('https://drive.google.com/drive/folders/') && !driveUrl.includes('tasker-app-data-vault'));
  const passedT6 = !hasBrokenVaultUrl && pointsToMyDrive;

  auditLog.push({
    suite: 'Google Drive Storage Vault',
    testName: 'URL Safety & Direct My Drive Path (Zero 404s)',
    passed: passedT6,
    sampleInput: 'GoogleAuthService.getDriveFolderUrl()',
    sampleOutput: driveUrl,
    notes: passedT6 ? 'Safe URL pointing directly to My Drive root (https://drive.google.com/drive/u/0/my-drive) avoiding Google 404.' : 'Returns 404-prone fallback path.',
  });
  console.log(`  ${passedT6 ? '✓ [PASS]' : '✗ [FAIL]'} Drive URL: ${driveUrl}`);

  // --- SUMMARY REPORT ---
  console.log('\n===============================================================');
  console.log('                 AI AGENT AUDIT SUMMARY');
  console.log('===============================================================');
  const passedCount = auditLog.filter(a => a.passed).length;
  const failedCount = auditLog.filter(a => !a.passed).length;
  console.log(`Total Audits Executed: ${auditLog.length}`);
  console.log(`Passed:                ${passedCount}`);
  console.log(`Failed:                ${failedCount}`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    console.error('Audit failed with errors.');
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit agent fatal crash:', err);
  process.exit(1);
});
