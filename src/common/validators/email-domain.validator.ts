import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class EmailDomainValidator implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    if (!email) return false;

    const isDevelopment =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

    // Em desenvolvimento, permite tanto @ifce.edu.br quanto @aluno.ifce.edu.br
    if (isDevelopment) {
      return /^[a-zA-Z0-9._%+-]+@(ifce\.edu\.br|aluno\.ifce\.edu\.br)$/.test(
        email,
      );
    }

    // Em produção, permite apenas @ifce.edu.br
    return /^[a-zA-Z0-9._%+-]+@ifce\.edu\.br$/.test(email);
  }

  defaultMessage(args: ValidationArguments) {
    const isDevelopment =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

    if (isDevelopment) {
      return 'Email deve ser do domínio @ifce.edu.br ou @aluno.ifce.edu.br';
    }

    return 'Email deve ser do domínio @ifce.edu.br';
  }
}

export function IsValidEmailDomain(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmailDomainValidator,
    });
  };
}
