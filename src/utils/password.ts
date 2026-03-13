export const PASSWORD_RULE_TEXT = "密码需为8-16位，并包含数字、字母和特殊符号"

// export const PASSWORD_RULE_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/

// 密码规则：仅包含字母和数字，长度8-16位
export const PASSWORD_RULE_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,16}$/;
export const isStrongPassword = (password: string) => PASSWORD_RULE_REGEX.test(password)

export const getPasswordValidationError = (password: string) => {
  if (!password) return "请输入密码"
  if (!isStrongPassword(password)) return PASSWORD_RULE_TEXT
  return null
}
