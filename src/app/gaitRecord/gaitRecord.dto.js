class GaitRecordDTO {
  constructor({ filename, classificationId, subjectId }) {
    this.subjectId = subjectId || null;
    this.filename = filename || '';
    this.classificationId = classificationId || '';
  }
}

export default GaitRecordDTO;
