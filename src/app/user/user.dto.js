class UserDTO {
  constructor({ firstname, lastname, age, height, weight }) {
    this.age = age || null;
    this.firstname = firstname || '';
    this.lastname = lastname || '';
    this.height = height || null;
    this.weight = weight || null;
  }
}

export default UserDTO;
