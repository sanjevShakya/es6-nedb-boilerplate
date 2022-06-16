import Subject from './subject.model';
import SubjectDTO from './subject.dto';

/**
 * Get all subjects.
 *
 * @returns {Promise}
 */
export function getAllSubjects() {
  return Subject.find();
}

/**
 * Get a subject.
 *
 * @param   {Number|String}  id
 * @returns {Promise}
 */
export function getSubject(id) {
  return Subject.findOne({ _id: id });
}

/**
 * Create new subject.
 *
 * @param   {Object}  subject
 * @returns {Promise}
 */
export function createSubject(subject) {
  const newSubject = new SubjectDTO(subject);

  return Subject.insert(newSubject);
}

/**
 * Update a subject.
 *
 * @param   {Number|String}  id
 * @param   {Object}         subject
 * @returns {Promise}
 */
export function updateSubject(id, subject) {
  return Subject.update({ _id: id }, { ...subject });
}

/**
 * Delete a subject.
 *
 * @param   {Number|String}  id
 * @returns {Promise}
 */
export function deleteSubject(id) {
  return Subject.remove({ _id: id });
}
