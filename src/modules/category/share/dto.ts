type PRIMARY_KEY = string | number | undefined;

export class CreateDTO {
  pid?: PRIMARY_KEY;
  nextId?: PRIMARY_KEY;
  title: string;
  description?: string;
}
