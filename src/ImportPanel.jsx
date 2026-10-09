import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from './ui.jsx';

const loadImporter = () => import('./importPlan.js');

function readFile(file) {
  return file.arrayBuffer();
}

export function ImportDialog({ state, onClose, onApply }) {
  const [preview, setPreview] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const onFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setPreview(null);
    setParsed(null);
    setFileName(file.name);
    try {
      const { parseWorkbook, applyWorkPlanImport } = await loadImporter();
      const imported = parseWorkbook(await readFile(file));
      if (!imported.objectives.length) throw new Error('No 2027 objectives were found on the working sheet.');
      setParsed(imported);
      setPreview(applyWorkPlanImport(state, imported).summary);
    } catch (failure) {
      setError(failure.message || 'The workbook could not be read.');
    }
  };

  const commit = async () => {
    if (!parsed) return;
    const { applyWorkPlanImport } = await loadImporter();
    onApply(applyWorkPlanImport(state, parsed).state);
  };

  return (
    <Modal eyebrow="ANNUAL WORK PLAN" title="Import 2027 objectives" subtitle="Reads the Annual Work Plan 2027_Working sheet. Only 2027 objectives are imported. Other years in the current plan stay as they are." onClose={onClose}>
      <div className="import-panel">
        <label className="file-picker">
          <Upload size={16} />
          <span>{fileName || 'Choose the Excel workbook'}</span>
          <input type="file" accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFile} />
        </label>
        {error && <p className="import-error" role="alert">{error}</p>}
        {preview && (
          <>
            <p className="import-sheet">Sheet: {preview.sheetName}</p>
            <div className="import-summary">
              <div><strong>{preview.objectives}</strong><span>2027 objectives</span></div>
              <div><strong>{preview.keyResults}</strong><span>Key results</span></div>
              <div><strong>{preview.initiatives}</strong><span>Team initiatives</span></div>
              <div><strong>{preview.verifications}</strong><span>Means of verification</span></div>
            </div>
            <p className="import-note">This replaces {preview.replaced} existing 2027 objectives. {preview.createdGoals} strategic goals and {preview.createdDivisions.length} departments will be added.</p>
            {preview.createdDivisions.length > 0 && <p className="import-note">New departments: {preview.createdDivisions.join(', ')}.</p>}
            <ul className="import-list">
              {parsed.objectives.slice(0, 8).map(objective => (
                <li key={objective.code}><b>{objective.code}</b> {objective.title}<small>{objective.department} · {objective.keyResults.length} key results · {objective.initiatives.length} initiatives</small></li>
              ))}
            </ul>
            {parsed.objectives.length > 8 && <p className="import-note">And {parsed.objectives.length - 8} more objectives.</p>}
            {preview.skipped.length > 0 && (
              <p className="import-note">Skipped {preview.skipped.length}: {preview.skipped.slice(0, 4).map(item => item.label).join('; ')}.</p>
            )}
            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="primary" onClick={commit}>Import 2027 objectives</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
