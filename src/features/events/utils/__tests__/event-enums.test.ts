import {
  EVALUATION_TYPE,
  toEvaluationTypeCode,
  toEvaluationTypeLabel,
} from '../event-enums';

describe('event-enums evaluation type helpers', () => {
  it('should resolve FINAL_PROJECTS inputs to the FINAL_PROJECTS code', () => {
    expect(toEvaluationTypeCode('FINAL_PROJECTS')).toBe(EVALUATION_TYPE.FINAL_PROJECTS);
    expect(toEvaluationTypeCode('Proyectos Finales')).toBe(EVALUATION_TYPE.FINAL_PROJECTS);
    expect(toEvaluationTypeCode(3)).toBe(EVALUATION_TYPE.FINAL_PROJECTS);
  });

  it('should preserve FINAL_PROJECTS when converting back to a label', () => {
    expect(toEvaluationTypeLabel('FINAL_PROJECTS')).toBe('FINAL_PROJECTS');
    expect(toEvaluationTypeLabel(3)).toBe('FINAL_PROJECTS');
  });
});